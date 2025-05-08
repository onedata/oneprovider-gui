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
import AutocompleteDropdownField from 'onedata-gui-common/utils/form-component/autocomplete-dropdown-field';
import FormFieldsRootGroup from 'onedata-gui-common/utils/form-component/form-fields-root-group';
import RadioField from 'onedata-gui-common/utils/form-component/radio-field';
import {
  destroyDestroyableComputedValues,
  destroyableComputed,
  initDestroyableCache,
} from 'onedata-gui-common/utils/destroyable-computed';
import jsonata from 'jsonata';

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
   * @type {PromiseObject<Array<{value: string, label: string}>>}
   */
  jsonKeyOptionsProxy: undefined,

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
  initialJsonKey: undefined,

  /**
   * @virtual optional
   * @type {string}
   */
  initialJsonQuery: '',

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
  xattrKeyFieldName: 'xattrKey',

  xattrOptions: reads('xattrOptionsProxy.content'),

  jsonKeyOptions: reads('jsonKeyOptionsProxy.content'),

  /**
   * @type {boolean}
   */
  isColumnNameModified: false,

  /**
   * @type {string}
   */
  columnName: '',

  /**
   * @type {string}
   */
  jsonKeyFieldName: 'jsonKey',

  /**
   * @type {string}
   */
  newJsonQuery: '',

  /**
   * @type {string}
   */
  metadataTypeFieldName: 'metadataType',

  /**
   * @type {string}
   */
  jsonTypeFieldName: 'jsonType',

  /**
   * @type {string}
   */
  newColumnName: computed(
    'columnName',
    'xattrKeyDropdownField.value',
    'isColumnNameModified',
    'initialDisplayedName',
    'metadataTypeValue',
    'jsonTypeField.value',
    'jsonKeyDropdownField.value',
    function newColumnName() {
      if (this.isColumnNameModified) {
        return this.columnName;
      }
      if (this.initialDisplayedName) {
        return this.initialDisplayedName;
      }
      if (this.metadataTypeValue === 'xattr') {
        return this.xattrKeyDropdownField.value;
      } else if (this.jsonTypeField.value === 'all') {
        return String(this.t('json'));
      } else if (this.jsonTypeField.value === 'query') {
        return this.t('jsonQuery').string;
      } else {
        return this.jsonKeyDropdownField.value;
      }
    }
  ),

  fields: destroyableComputed(
    'xattrKeyDropdownField',
    'metadataTypeField',
    'jsonTypeField',
    'jsonKeyDropdownField',
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
            this.jsonKeyDropdownField,
          ],
        });
    }
  ),

  xattrKeyDropdownField: computed(
    function xattrKeyDropdownField() {
      return AutocompleteDropdownField
        .extend({
          options: reads('columnEditorComponent.xattrOptions'),
        })
        .create({
          columnEditorComponent: this,
          name: this.xattrKeyFieldName,
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
        valueChanged() {
          this._super(...arguments);
          this.set('columnEditorComponent.isColumnNameModified', false);
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
      .create({
        columnEditorComponent: this,
        name: this.jsonTypeFieldName,
        options: [
          { value: 'all' },
          { value: 'key' },
          { value: 'query' },
        ],
        defaultValue: this.initialJsonQueryType,
        tooltipClass: 'tooltip-lg tooltip-text-left',
      });
  }),

  jsonKeyDropdownField: computed(
    function jsonKeyDropdownField() {
      return AutocompleteDropdownField
        .extend({
          options: reads('columnEditorComponent.jsonKeyOptions'),
        })
        .create({
          columnEditorComponent: this,
          name: this.jsonKeyFieldName,
          defaultValue: this.initialJsonKey,
          isOptional: true,
        });
    }
  ),

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
   * @type {ComputedProperty<Utils.FormComponent.FormElement>}
   */
  jsonKeyDropdown: computed('fields', 'jsonKeyFieldName', function jsonKeyDropdown() {
    return this.fields.getFieldByPath(this.jsonKeyFieldName);
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
    'jsonKeyDropdownField.value',
    'newJsonQuery',
    'validationError',
    'validationErrorMessage',
    function disabledEditButtonTooltip() {
      if (
        !this.newColumnName ||
        (!this.xattrKeyDropdownField.value && this.metadataTypeValue === 'xattr') ||
        (
          !this.jsonKeyDropdownField.value && this.metadataTypeValue === 'json' &&
          this.jsonTypeField.value === 'key'
        ) ||
        (
          !this.newJsonQuery && this.metadataTypeValue === 'json' &&
          this.jsonTypeField.value === 'query'
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
      if (
        this.metadataTypeValue === 'json' &&
        this.jsonTypeField.value === 'query' &&
        !this.validationError
      ) {
        return this.validationErrorMessage;
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
    'jsonKeyDropdownField.value',
    'newJsonQuery',
    function isColumnAlreadyExisting() {
      let properties = {};
      if (this.metadataTypeValue === 'xattr') {
        properties = { xattrKey: this.xattrKeyDropdownField.value };
      } else {
        properties = {
          queryType: this.jsonTypeField.value,
          jsonKey: this.jsonKeyDropdownField.value,
          jsonQuery: this.newJsonQuery,
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

  validationError: computed('newJsonQuery', function validationError() {
    return this.isValidJSONataExpression(this.newJsonQuery).isValid;
  }),

  validationErrorMessage: computed(
    'validationError',
    function validationErrorMessage() {
      const validationInfo = this.isValidJSONataExpression(this.newJsonQuery);
      return validationInfo.isValid ? '' : validationInfo.error.message;
    }
  ),

  isValidJSONataExpression(expression) {
    try {
      jsonata(expression);
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error };
    }
  },

  init() {
    initDestroyableCache(this);
    this._super(...arguments);
    this.set('newJsonQuery', this.initialJsonQuery);
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
    changeColumnName(value) {
      this.setProperties({
        isColumnNameModified: true,
        columnName: value,
      });
    },
    submitColumn() {
      const type = this.metadataTypeValue;
      const options = type === 'xattr' ? { xattrKey: this.xattrKeyDropdownField.value } : {
        queryType: this.jsonTypeField.value,
        jsonKey: this.jsonKeyDropdownField.value,
        jsonQuery: this.newJsonQuery,
      };
      this.onSubmitColumn(
        this.isNewColumn,
        type,
        this.newColumnName,
        options,
      );
    },
  },
});
