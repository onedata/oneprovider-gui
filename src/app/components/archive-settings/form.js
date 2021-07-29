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
import StaticTextField from 'onedata-gui-common/utils/form-component/static-text-field';
import FormFieldsRootGroup from 'onedata-gui-common/utils/form-component/form-fields-root-group';
import { tag, not } from 'ember-awesome-macros';
import { scheduleOnce } from '@ember/runloop';
import { reads } from '@ember/object/computed';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

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
   * @virtual
   * @type {CreateArchiveOptions}
   */
  options: undefined,

  rootFormGroupClass: computed(function rootFormGroupClass() {
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
      });
  }),

  /**
   * @type {ComputedProperty<FormFieldsRootGroup>}
   */
  rootFieldGroup: computed('options', function rootFieldGroup() {
    const options = this.get('options');
    const baseArchive = options && options.baseArchive;
    const isBaseArchiveProvided = Boolean(baseArchive);
    const component = this;

    const configLayoutField = RadioField.create({
      name: 'layout',
      defaultValue: 'plain',
      options: [
        { value: 'plain' },
        { value: 'bagit' },
      ],
    });

    const configNestedField = ToggleField.create({
      name: 'createNestedArchives',
      defaultValue: false,
    });

    const configIncrementalField = ToggleField.create({
      name: 'incremental',
      defaultValue: isBaseArchiveProvided,
      isEnabled: !isBaseArchiveProvided,
      tip: this.t(`incrementalTip.${isBaseArchiveProvided ? 'selected' : 'latest'}`),
    });

    const configDipField = ToggleField.create({
      name: 'includeDip',
      defaultValue: false,
    });

    const configFields = [
      configLayoutField,
      configNestedField,
      configIncrementalField,
    ];

    if (isBaseArchiveProvided) {
      const baseArchiveInfoField = StaticTextField.create({
        name: 'baseArchiveName',
        value: get(baseArchive, 'name'),
      });
      configFields.push(baseArchiveInfoField);
    }
    configFields.push(configDipField);

    return this.get('rootFormGroupClass')
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
            fields: configFields,
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
