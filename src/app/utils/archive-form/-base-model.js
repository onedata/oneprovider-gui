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
import { tag, not, or, raw, conditional, and, equal } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
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

  disabled: false,

  rootFormGroupClass: computed(function rootFormGroupClass() {
    return FormFieldsRootGroup
      .extend({
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
        loadingProxy: reads('parent.baseArchiveProxy'),
      })
      .create({
        siblingName: 'baseArchiveInfo',
        name: 'baseArchiveLoading',
      });

    const baseArchiveInfoField = StaticTextField
      .extend({
        isVisible: reads('parent.baseArchiveProxy.isSettled'),
        value: conditional(
          // FIXME: handling cannot fetch latest archive should be in create-model
          // FIXME: handle errors in fetching base archive in show model
          and(
            'parent.baseArchiveProxy.isCustomOnedataError',
            equal(
              'parent.baseArchiveProxy.type',
              raw('cannot-fetch-latest-archive')
            ),
          ),
          computedT('latestArchive'),
          or(
            'parent.baseArchiveProxy.name',
            raw('–'),
          ),
        ),
      })
      .create({
        name: 'baseArchiveInfo',
        tooltipClass: 'tooltip-lg tooltip-text-left',
      });

    return FormFieldsGroup
      .extend({
        isIncremental: reads('parent.value.incremental'),
        isExpanded: reads('isIncremental'),
        baseArchiveProxy: reads('formModel.baseArchiveProxy'),
      })
      .create({
        formModel: this,
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
    return FormFieldsGroup.create({
      name: 'config',
      fields: configFields,
    });
  }),

  /**
   * @type {ComputedProperty<FormFieldsRootGroup>}
   */
  rootFieldGroup: computed(function rootFieldGroup() {
    const {
      rootFormGroupClass,
      descriptionField,
      configField,
    } = this.getProperties(
      'rootFormGroupClass',
      'descriptionField',
      'configField',
    );

    return rootFormGroupClass
      .create({
        formModel: this,
        fields: [
          descriptionField,
          configField,
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

  destroy() {
    this._super(...arguments);
    this.get('rootFieldGroup').destroy();
  },
});
