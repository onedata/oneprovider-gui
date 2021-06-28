/**
 * Form with settings for archive model 
 *
 * @module components/archive-settings/form
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import FormFieldsGroup from 'onedata-gui-common/utils/form-component/form-fields-group';
import TextareaField from 'onedata-gui-common/utils/form-component/textarea-field';
import RadioField from 'onedata-gui-common/utils/form-component/radio-field';
import ToggleField from 'onedata-gui-common/utils/form-component/toggle-field';
import FormFieldsRootGroup from 'onedata-gui-common/utils/form-component/form-fields-root-group';
import { tag, not } from 'ember-awesome-macros';
import { scheduleOnce } from '@ember/runloop';
import { reads } from '@ember/object/computed';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import TextField from 'onedata-gui-common/utils/form-component/text-field';

export default Component.extend(I18n, {
  classNames: ['form', 'form-horizontal', 'form-component'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveSettings.form',

  /**
   * @virtual
   * @type {({ formData: EmberObject, isValid: Boolean }) => any}
   */
  onChange: notImplementedIgnore,

  /**
   * Set to true, to indicate that form submit is in progress
   * @virtual optional
   * @type {Boolean}
   */
  isSubmitting: false,

  /**
   * @type {ComputedProperty<FormFieldsRootGroup>}
   */
  rootFieldGroup: computed(function rootFieldGroup() {
    const component = this;
    return FormFieldsRootGroup
      .extend({
        ownerSource: reads('component'),
        i18nPrefix: tag `${'component.i18nPrefix'}.settingsForm`,
        isEnabled: not('component.isSubmitting'),
        onValueChange() {
          this._super(...arguments);
          scheduleOnce('afterRender', component, 'notifyAboutChange');
        },
      })
      .create({
        component,
        fields: [
          TextareaField.create({
            name: 'description',
            defaultValue: '',
            isOptional: true,
          }),
          FormFieldsGroup.create({
            name: 'config',
            fields: [
              RadioField.create({
                name: 'layout',
                defaultValue: 'plain',
                options: [
                  { value: 'plain' },
                  { value: 'bagit' },
                ],
              }),
              ToggleField.create({
                name: 'createNestedArchives',
                defaultValue: false,
              }),
              ToggleField.create({
                name: 'incremental',
                defaultValue: false,
                isEnabled: false,
              }),
              TextField.extend({
                isVisible: reads('parent.value.incremental'),
              }).create({
                isOptional: true,
                name: 'baseArchiveId',
              }),
              ToggleField.create({
                name: 'includeDip',
                defaultValue: false,
                isEnabled: false,
              }),
            ],
          }),
          // TODO: VFS-7547 should be available in view/edit mode
          // TextField.create({
          //   name: 'preservedCallback',
          //   defaultValue: '',
          //   isOptional: true,
          // }),
          // TODO: VFS-7547 should be available in view/edit mode
          // TextField.create({
          //   name: 'purgedCallback',
          //   defaultValue: '',
          //   isOptional: true,
          // }),
        ],
      });
  }),

  notifyAboutChange() {
    safeExec(this, () => {
      const {
        rootFieldGroup,
        onChange,
      } = this.getProperties('rootFieldGroup', 'onChange');

      const isValid = get(rootFieldGroup, 'isValid');

      onChange({
        formData: rootFieldGroup.dumpValue(),
        isValid,
      });
    });
  },

  /**
   * @override
   */
  willDestroyElement() {
    this._super(...arguments);
    this.get('rootFieldGroup').destroy();
  },
});
