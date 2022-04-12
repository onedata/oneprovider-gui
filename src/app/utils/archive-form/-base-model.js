/**
 * Base configuration of archive form.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject from '@ember/object';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { computed, get, observer } from '@ember/object';
import FormFieldsGroup from 'onedata-gui-common/utils/form-component/form-fields-group';
import TextareaField from 'onedata-gui-common/utils/form-component/textarea-field';
import RadioField from 'onedata-gui-common/utils/form-component/radio-field';
import ToggleField from 'onedata-gui-common/utils/form-component/toggle-field';
import StaticTextField from 'onedata-gui-common/utils/form-component/static-text-field';
import SiblingLoadingField from 'onedata-gui-common/utils/form-component/sibling-loading-field';
import FormFieldsRootGroup from 'onedata-gui-common/utils/form-component/form-fields-root-group';
import { tag, not } from 'ember-awesome-macros';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { scheduleOnce } from '@ember/runloop';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default EmberObject.extend(OwnerInjector, I18n, {
  /**
   * @override
   */
  i18nPrefix: 'utils.archiveForm.baseModel',

  /**
   * @virtual
   * @type {({ formData: Object, isValid: boolean }) => void}
   */
  onChange: notImplementedIgnore,

  /**
   * @virtual
   * @type {Utils.FormComponent.ToggleField}
   */
  configIncrementalField: undefined,

  /**
   * @virtual
   * @type {FormFieldsRootGroup}
   */
  rootFieldGroup: undefined,

  disabled: false,

  /**
   * @virtual
   * @type {string|SafeString}
   */
  baseArchiveTextProxy: undefined,

  rootFormGroupClass: computed(function rootFormGroupClass() {
    const formModel = this;
    return FormFieldsRootGroup
      .extend({
        formModel,
        ownerSource: reads('formModel'),
        i18nPrefix: tag `${'formModel.i18nPrefix'}`,
        isEnabled: not('formModel.disabled'),
        onValueChange() {
          this._super(...arguments);
          const formModel = this.get('formModel');
          scheduleOnce('afterRender', formModel, 'notifyAboutChange');
        },
      });
  }),

  baseArchiveGroup: computed(function baseArchiveGroup() {
    const baseArchiveLoadingField = SiblingLoadingField
      .extend({
        loadingProxy: reads('parent.baseArchiveTextProxy'),
      })
      .create({
        siblingName: 'baseArchiveInfo',
        name: 'baseArchiveLoading',
        tooltipClass: 'tooltip-lg tooltip-text-left',
      });

    const baseArchiveInfoField = StaticTextField
      .extend({
        baseArchiveTextProxy: reads('parent.baseArchiveTextProxy'),
        isVisible: reads('baseArchiveTextProxy.isFulfilled'),
        value: reads('baseArchiveTextProxy.content'),
      })
      .create({
        name: 'baseArchiveInfo',
        tooltipClass: 'tooltip-lg tooltip-text-left',
      });

    return FormFieldsGroup
      .extend({
        formModel: reads('parent.formModel'),
        isIncremental: reads('parent.value.incremental'),
        isExpanded: reads('isIncremental'),
        baseArchiveTextProxy: reads('formModel.baseArchiveTextProxy'),
      })
      .create({
        name: 'baseArchiveGroup',
        fields: [
          baseArchiveLoadingField,
          baseArchiveInfoField,
        ],
      });
  }),

  configLayoutField: computed(function configLayoutField() {
    return RadioField.create({
      name: 'layout',
      defaultValue: 'plain',
      options: [
        { value: 'plain' },
        { value: 'bagit' },
      ],
      tooltipClass: 'tooltip-lg tooltip-text-left',
    });
  }),

  configNestedField: computed(function configNestedField() {
    return ToggleField.create({
      name: 'createNestedArchives',
      defaultValue: false,
      tooltipClass: 'tooltip-lg tooltip-text-left',
    });
  }),

  configDipField: computed(function configDipField() {
    return ToggleField.create({
      name: 'includeDip',
      defaultValue: false,
      tooltipClass: 'tooltip-lg tooltip-text-left',
    });
  }),

  configSymlinksField: computed(function configSymlinksField() {
    return ToggleField.create({
      name: 'followSymlinks',
      defaultValue: true,
      tooltipClass: 'tooltip-lg tooltip-text-left',
    });
  }),

  configIncrementalFieldClass: computed(function configIncrementalFieldClass() {
    return ToggleField
      .extend({
        formModel: reads('parent.formModel'),
        name: 'incremental',
        tooltipClass: 'tooltip-lg tooltip-text-left',
      });
  }),

  descriptionField: computed(function descriptionField() {
    return TextareaField.create({
      name: 'description',
      defaultValue: '',
      isOptional: true,
    });
  }),

  configField: computed(function configField() {
    const {
      baseArchiveGroup,
      configLayoutField,
      configNestedField,
      configDipField,
      configSymlinksField,
      configIncrementalField,
    } = this.getProperties(
      'baseArchiveGroup',
      'configLayoutField',
      'configNestedField',
      'configDipField',
      'configSymlinksField',
      'configIncrementalField',
    );
    const configFields = [
      configLayoutField,
      configNestedField,
      configIncrementalField,
      baseArchiveGroup,
      configDipField,
      configSymlinksField,
    ];
    return FormFieldsGroup
      .extend({
        formModel: reads('parent.formModel'),
      })
      .create({
        name: 'config',
        addColonToLabel: false,
        fields: configFields,
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

  destroy() {
    this._super(...arguments);
    this.get('rootFieldGroup').destroy();
  },
});
