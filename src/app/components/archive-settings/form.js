/**
 * Form with settings for archive model 
 *
 * @module components/archive-settings/form
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get, observer } from '@ember/object';
import FormFieldsGroup from 'onedata-gui-common/utils/form-component/form-fields-group';
import TextareaField from 'onedata-gui-common/utils/form-component/textarea-field';
import RadioField from 'onedata-gui-common/utils/form-component/radio-field';
import ToggleField from 'onedata-gui-common/utils/form-component/toggle-field';
import StaticTextField from 'onedata-gui-common/utils/form-component/static-text-field';
import SiblingLoadingField from 'onedata-gui-common/utils/form-component/sibling-loading-field';
import FormFieldsRootGroup from 'onedata-gui-common/utils/form-component/form-fields-root-group';
import { tag, not, or, raw } from 'ember-awesome-macros';
import { scheduleOnce } from '@ember/runloop';
import { reads } from '@ember/object/computed';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default Component.extend(I18n, {
  classNames: ['form', 'form-horizontal', 'form-component', 'archive-settings-form'],

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
   * @type {() => PromiseObject<Utils.BrowsableArchive>}
   */
  baseArchiveProxy: undefined,

  /**
   * @virtual
   * @type {() => PromiseObject<Utils.BrowsableArchive>}
   */
  updateBaseArchiveProxy: undefined,

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

  baseArchiveGroup: computed(function baseArchiveGroup() {
    const baseArchiveLoadingField = SiblingLoadingField
      .extend({
        loadingProxy: reads('parent.baseArchiveProxy'),
      })
      .create({
        siblingName: 'baseArchiveInfo',
        name: 'baseArchiveLoading',
      });

    const baseArchiveInfoField = StaticTextField
      .extend({
        isVisible: reads('parent.baseArchiveProxy.isSettled'),
        value: or(
          'parent.baseArchiveProxy.name',
          raw('–'),
        ),
      })
      .create({
        name: 'baseArchiveInfo',
      });

    return FormFieldsGroup
      .extend({
        isIncremental: reads('parent.value.incremental'),
        isExpanded: reads('isIncremental'),
        baseArchiveProxy: reads('component.baseArchiveProxy'),
      })
      .create({
        component: this,
        name: 'baseArchiveGroup',
        fields: [
          baseArchiveLoadingField,
          baseArchiveInfoField,
        ],
      });
  }),

  /**
   * @type {ComputedProperty<FormFieldsRootGroup>}
   */
  rootFieldGroup: computed(function rootFieldGroup() {
    const {
      baseArchiveGroup,
      options,
    } = this.getProperties('baseArchiveGroup', 'options');
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

    const configIncrementalField = ToggleField
      .extend({
        onValueChange() {
          this._super(...arguments);
          const value = this.get('value');
          if (value) {
            this.get('component.updateBaseArchiveProxy')();
          }
        },
      })
      .create({
        name: 'incremental',
        component: this,
        defaultValue: isBaseArchiveProvided,
        isEnabled: !isBaseArchiveProvided,
      });

    const configDipField = ToggleField.create({
      name: 'includeDip',
      defaultValue: false,
    });

    const configFields = [
      configLayoutField,
      configNestedField,
      configIncrementalField,
      baseArchiveGroup,
      configDipField,
    ];

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

  /**
   * Note: this is a hack to handle base archive loading field fulfillment that
   * changes `isValid`, because loading field does not emit value change events.
   */
  baseArchiveGroupValidObserver: observer(
    'baseArchiveGroup.isValid',
    function baseArchiveGroupValidObserver() {
      scheduleOnce('actions', this, 'notifyAboutChange');
    }
  ),

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
