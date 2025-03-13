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

const defaultWholeJsonLabel = 'JSON';

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
   * @type {ColumnType}
   */
  initialMetadataType: 'xattr',

  /**
   * @virtual optional
   * @type {string}
   */
  initialXattrKey: undefined,

  /**
   * @virtual optional
   * @type {JsonQueryType}
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

  /**
   * @type {string}
   */
  oldColumnName: undefined,

  /**
   * @type {string}
   */
  xattrKeyFieldName: 'xattrKey',

  /**
   * @type {string}
   */
  metadataTypeFieldName: 'metadataType',

  /**
   * @type {string}
   */
  jsonTypeFieldName: 'jsonType',

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
              (
                this.oldValue === undefined &&
                !this.columnEditorComponent.newColumnName
              ) ||
              this.oldValue === this.columnEditorComponent.newColumnName ||
              !this.columnEditorComponent.newColumnName
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

  /**
   * @type {ComputedProperty<Utils.FormComponent.RadioField>}
   */
  metadataTypeField: computed(function metadataTypeField() {
    return RadioField
      .extend({
        valueChanged(option) {
          this._super(...arguments);
          const editor = this.columnEditorComponent;

          if (option === 'json') {
            if (editor.jsonTypeField.value === 'all') {
              this.set('columnEditorComponent.newColumnName', defaultWholeJsonLabel);
            } else {
              this.set('columnEditorComponent.newColumnName', editor.newJsonKey);
            }
          } else if (option === 'xattr') {
            this.set(
              'columnEditorComponent.newColumnName',
              editor.xattrKeyDropdownField.value
            );
          }
        },
      })
      .create({
        columnEditorComponent: this,
        name: this.metadataTypeFieldName,
        options: [
          { value: 'xattr' },
          { value: 'json' },
        ],
        defaultValue: this.initialMetadataType,
        tooltipClass: 'tooltip-lg tooltip-text-left',
      });
  }),

  /**
   * @type {ComputedProperty<string>}
   */
  metadataTypeValue: reads('metadataTypeField.value'),

  /**
   * @type {ComputedProperty<Utils.FormComponent.RadioField>}
   */
  jsonTypeField: computed(function jsonTypeField() {
    return RadioField
      .extend({
        valueChanged(option) {
          this._super(...arguments);
          const editor = this.columnEditorComponent;
          if (
            option === 'all' &&
            (
              !editor.newColumnName ||
              editor.newJsonKey === editor.newColumnName
            )
          ) {
            this.set('columnEditorComponent.newColumnName', defaultWholeJsonLabel);
          }
          if (
            option === 'key' &&
            editor.newColumnName === defaultWholeJsonLabel
          ) {
            this.set('columnEditorComponent.newColumnName', editor.newJsonKey);
          }
          this.set('oldValue', this.value);
        },
      })
      .create({
        columnEditorComponent: this,
        name: this.jsonTypeFieldName,
        options: [
          { value: 'all' },
          { value: 'key' },
        ],
        defaultValue: this.initialJsonQueryType,
        tooltipClass: 'tooltip-lg tooltip-text-left',
      });
  }),

  /**
   * @type {ComputedProperty<Utils.FormComponent.FormElement>}
   */
  xattrKeyDropdown: computed('fields', 'xattrKeyFieldName', function xattrKeyDropdown() {
    return this.fields.getFieldByPath(this.xattrKeyFieldName);
  }),

  /**
   * @type {ComputedProperty<Utils.FormComponent.FormElement>}
   */
  metadataType: computed('fields', 'metadataTypeFieldName', function metadataType() {
    return this.fields.getFieldByPath(this.metadataTypeFieldName);
  }),

  /**
   * @type {ComputedProperty<Utils.FormComponent.FormElement>}
   */
  jsonType: computed('fields', 'jsonTypeFieldName', function jsonType() {
    return this.fields.getFieldByPath(this.jsonTypeFieldName);
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
    'metadataTypeValue',
    'jsonTypeField.value',
    'newJsonKey',
    function disabledEditButtonTooltip() {
      if (
        !this.newColumnName ||
        (!this.xattrKeyDropdownField.value && this.metadataTypeValue === 'xattr') ||
        (
          !this.newJsonKey && this.metadataTypeValue === 'json' &&
          this.jsonTypeField.value === 'key'
        )
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
      let properties = {};
      if (this.metadataTypeValue === 'xattr') {
        properties = { xattrKey: this.xattrKeyDropdownField.value };
      } else {
        properties = {
          queryType: this.jsonTypeField.value,
          jsonKey: this.newJsonKey,
        };
      }
      return this.columnsConfiguration
        .tryCreateUniqueColumnKey(
          this.newColumnName,
          properties,
          this.metadataTypeValue,
        ).exists === true;
    }
  ),

  init() {
    initDestroyableCache(this);
    this._super(...arguments);
    this.setProperties({
      newColumnName: this.initialDisplayedName,
      oldColumnName: this.initialJsonKey,
      newJsonKey: this.initialJsonKey,
    });
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
      const options = type === 'xattr' ? { xattrKey: this.xattrKeyDropdownField.value } : {
        queryType: this.jsonTypeField.value,
        jsonKey: this.newJsonKey,
      };
      this.onSubmitColumn(
        this.isNewColumn,
        type,
        this.newColumnName,
        options,
      );
    },
    changeJsonKey(key) {
      this.set('newJsonKey', key);
      if (
        this.oldColumnName === undefined ||
        this.oldColumnName === this.newColumnName ||
        !this.newColumnName
      ) {
        this.setProperties({
          newColumnName: key,
          oldColumnName: key,
        });
      }
    },
  },
});
