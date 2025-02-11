/**
 * Renders column modification or new column creation content.
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { reads, bool } from '@ember/object/computed';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';
import CustomValueDropdownField from 'onedata-gui-common/utils/form-component/custom-value-dropdown-field';
import FormFieldsRootGroup from 'onedata-gui-common/utils/form-component/form-fields-root-group';
import RadioField from 'onedata-gui-common/utils/form-component/radio-field';
import {
  destroyDestroyableComputedValues,
  destroyableComputed,
  initDestroyableCache,
} from 'onedata-gui-common/utils/destroyable-computed';

export default Component.extend(I18n, {
  classNames: ['column-editor'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.columnsConfigurationPopover.columnEditor',

  /**
   * @virtual
   * @type {boolean}
   */
  isNewColumn: true,

  /**
   * @virtual
   * @type {PromiseObject<Array<{value: string, label: string}>>}
   */
  xattrOptionsProxy: undefined,

  /**
   * @virtual
   * @type {Utils.ColumnsConfiguration}
   */
  columnsConfiguration: undefined,

  /**
   * @virtual
   * @type {(name: string, key: string, isNewColumn: boolean) => void}
   */
  onSubmitColumn: notImplementedWarn,

  /**
   * @virtual
   * @type {() => void}
   */
  onGoBack: notImplementedWarn,

  /**
   * @virtual optional
   * @type {string}
   */
  initialDisplayedName: '',

  /**
   * @virtual optional
   * @type {string}
   */
  initialJsonKey: '',

  /**
   * @virtual optional
   * @type {string}
   */
  initialMetadataType: 'xattr',

  /**
   * @virtual optional
   * @type {string}
   */
  initialXattrKey: undefined,

  /**
   * @virtual optional
   * @type {string}
   */
  initialJsonQueryType: 'all',

  /**
   * @type {string}
   */
  newColumnName: '',

  /**
   * @type {string}
   */
  newJsonKey: '',

  oldColumnName: undefined,

  /**
   * @type {string}
   */
  xattrKeyFieldName: 'xattrKey',

  xattrOptions: reads('xattrOptionsProxy.content'),

  fields: destroyableComputed(
    'xattrKeyDropdownField',
    'metadataTypeField',
    'jsonTypeField',
    function fields() {
      return FormFieldsRootGroup
        .create({
          ownerSource: this,
          columnEditorComponent: this,
          i18nPrefix: this.i18nPrefix,
          size: 'sm',
          fields: [
            this.xattrKeyDropdownField,
            this.metadataTypeField,
            this.jsonTypeField,
          ],
        });
    }
  ),

  xattrKeyDropdownField: computed(
    function xattrKeyDropdownField() {
      return CustomValueDropdownField
        .extend({
          options: reads('columnEditorComponent.xattrOptions'),
          valueChanged(option) {
            this._super(...arguments);
            if (
              this.oldValue === undefined ||
              this.oldValue === this.columnEditorComponent.newColumnName
            ) {
              this.set('columnEditorComponent.newColumnName', option);
            }
            this.set('oldValue', this.value);
          },
        })
        .create({
          columnEditorComponent: this,
          name: this.xattrKeyFieldName,
          oldValue: this.initialXattrKey,
          defaultValue: this.initialXattrKey,
          isOptional: true,
        });
    }
  ),

  metadataTypeField: computed(function metadataTypeField() {
    return RadioField.create({
      name: 'metadataType',
      options: [
        { value: 'xattr' },
        { value: 'json' },
      ],
      tooltipClass: 'tooltip-lg tooltip-text-left',
      defaultValue: this.initialMetadataType,
    });
  }),

  jsonTypeField: computed(function jsonTypeField() {
    return RadioField.create({
      name: 'jsonType',
      defaultValue: this.initialJsonQueryType ? this.initialJsonQueryType : 'all',
      options: [
        { value: 'all' },
        { value: 'key' },
      ],
      tooltipClass: 'tooltip-lg tooltip-text-left',
    });
  }),

  xattrKeyDropdown: computed('fields', 'xattrKeyFieldName', function xattrKeyDropdown() {
    return this.fields.getFieldByPath(this.xattrKeyFieldName);
  }),

  metadataType: computed('fields', function metadataType() {
    return this.fields.getFieldByPath('metadataType');
  }),

  jsonType: computed('fields', function jsonTypeField() {
    return this.fields.getFieldByPath('jsonType');
  }),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isDisabledEditButton: bool('disabledEditButtonTooltip'),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  disabledEditButtonTooltip: computed(
    'isColumnAlreadyExisting',
    'isColumnLabelAlreadyExisting',
    'newColumnName',
    'xattrKeyDropdownField.value',
    'metadataTypeField.value',
    'jsonTypeField.value',
    'newJsonKey',
    function disabledEditButtonTooltip() {
      if (
        !this.newColumnName ||
        (!this.xattrKeyDropdownField.value && this.metadataTypeField.value === 'xattr') ||
        (!this.newJsonKey && this.metadataTypeField.value === 'json' &&
          this.jsonTypeField.value === 'key')
      ) {
        return this.t('emptyValueTooltip');
      }
      if (this.isColumnAlreadyExisting) {
        return this.t('columnExistsTooltip');
      }
      if (this.isColumnLabelAlreadyExisting) {
        return this.t('columnLabelExistsTooltip');
      }
      return '';
    }
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isColumnLabelAlreadyExisting: computed(
    'newColumnName',
    'initialDisplayedName',
    function isColumnLabelAlreadyExisting() {
      return (
        this.initialDisplayedName === undefined ||
        this.initialDisplayedName !== this.newColumnName
      ) && this.columnsConfiguration.checkIfDisplayedNameExist(this.newColumnName);
    }
  ),

  metadataTypeValue: reads('metadataTypeField.value'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isColumnAlreadyExisting: computed(
    'newColumnName',
    'xattrKeyDropdownField.value',
    'jsonTypeField.value',
    'metadataTypeValue',
    'newJsonKey',
    function isColumnAlreadyExisting() {
      if (this.metadataTypeValue === 'xattr') {
        return this.columnsConfiguration
          .tryCreateUniqueColumnKey(
            this.newColumnName, { xattrKey: this.xattrKeyDropdownField.value },
            'xattr',
          ).exists === true;
      } else {
        return this.columnsConfiguration
          .tryCreateUniqueColumnKey(
            this.newColumnName, {
              queryType: this.jsonTypeField.value,
              jsonKey: this.newJsonKey,
            },
            'json',
          ).exists === true;
      }
    }
  ),

  init() {
    initDestroyableCache(this);
    this._super(...arguments);
    this.set('newColumnName', this.initialDisplayedName);
    this.set('newJsonKey', this.initialJsonKey);
    this.set('oldColumnName', this.initialJsonKey);
  },

  /**
   * @override
   */
  willDestroy() {
    try {
      destroyDestroyableComputedValues(this);
    } finally {
      this._super(...arguments);
    }
  },

  actions: {
    goBack() {
      this.onGoBack();
    },
    submitColumn() {
      const type = this.metadataTypeValue;
      const option = type === 'xattr' ? { xattrKey: this.xattrKeyDropdownField.value } : {
        queryType: this.jsonTypeField.value,
        jsonKey: this.newJsonKey,
      };
      this.onSubmitColumn(
        this.isNewColumn,
        type,
        this.newColumnName,
        option,
      );
    },
    changeJsonKey(key) {
      this.set('newJsonKey', key);
      if (this.oldColumnName === undefined || this.oldColumnName === this.newColumnName) {
        this.set('newColumnName', key);
        this.set('oldColumnName', key);
      }
    },
  },
});
