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

const defaultWholeJsonLabel = 'JSON';
const defaultQueryJsonLabel = 'JSON query';

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
  newJsonKey: '',

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
    'newJsonKey',
    function newColumnName() {
      if (this.isColumnNameModified) {
        return this.columnName;
      }
      if (this.initialDisplayedName) {
        return this.initialDisplayedName;
      }
      if (this.metadataTypeValue === 'xattr') {
        return this.xattrKeyDropdownField.value;
      }
      if (this.jsonTypeField.value === 'all') {
        return defaultWholeJsonLabel;
      }
      if (this.jsonTypeField.value === 'query') {
        return defaultQueryJsonLabel;
      }
      return this.newJsonKey;
    }
  ),

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
        options: reads('columnEditorComponent.xattrOptions'),
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
    'newJsonQuery',
    function disabledEditButtonTooltip() {
      if (
        !this.newColumnName ||
        (!this.xattrKeyDropdownField.value && this.metadataTypeValue === 'xattr') ||
        (
          !this.newJsonKey && this.metadataTypeValue === 'json' &&
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
    'newJsonQuery',
    function isColumnAlreadyExisting() {
      let properties = {};
      if (this.metadataTypeValue === 'xattr') {
        properties = { xattrKey: this.xattrKeyDropdownField.value };
      } else {
        properties = {
          queryType: this.jsonTypeField.value,
          jsonKey: this.newJsonKey,
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

  init() {
    initDestroyableCache(this);
    this._super(...arguments);
    this.setProperties({
      newJsonKey: this.initialJsonKey,
      newJsonQuery: this.initialJsonQuery,
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
        jsonKey: this.newJsonKey,
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
