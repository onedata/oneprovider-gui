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
  editColumnAction: notImplementedWarn,

  /**
   * @virtual
   * @type {() => void}
   */
  goBackAction: notImplementedWarn,

  /**
   * @virtual optional
   * @type {string}
   */
  newColumnName: '',

  /**
   * @virtual optional
   * @type {string}
   */
  oldDisplayedName: '',

  /**
   * @virtual optional
   * @type {string}
   */
  oldXattrKey: undefined,

  /**
   * @type {string}
   */
  xattrKeyFieldName: 'xattrKey',

  xattrOptions: reads('xattrOptionsProxy.content'),

  xattrKeyNameField: computed('xattrKeyNameDropdownField', function xattrKeyNameField() {
    return FormFieldsRootGroup
      .create({
        ownerSource: this,
        columnEditorComponent: this,
        i18nPrefix: this.i18nPrefix,
        fields: [
          this.xattrKeyNameDropdownField,
        ],
      });
  }),

  xattrKeyNameDropdownField: computed(
    'xattrOptions',
    function xattrKeyNameDropdownField() {
      return CustomValueDropdownField
        .extend({
          options: this.xattrOptions,
          valueChanged(option) {
            this._super(...arguments);
            if (this.oldValue === undefined ||
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
          oldValue: this.oldXattrKey,
          defaultValue: this.oldXattrKey,
          size: 'sm',
          isOptional: true,
          injectedCustomValueInputPlaceholder: this.t('dropdownPlaceholder'),
          injectedCustomValueOptionTextPrefix: this.t('customKeyPlaceholder'),
          initiallyOpened: true,
          renderInPlace: true,
        });
    }
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isDisabledEditButton: bool('disabledEditButtonTooltip'),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  disabledEditButtonTooltip: computed(
    'isEmptyValue',
    'isColumnAlreadyExisting',
    'isColumnLabelAlreadyExisting',
    function disabledEditButtonTooltip() {
      if (this.isEmptyValue) {
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
  isEmptyValue: computed(
    'newColumnName',
    'xattrKeyNameDropdownField.value',
    function isEmptyValue() {
      return !this.newColumnName || !this.xattrKeyNameDropdownField.value;
    }
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isColumnLabelAlreadyExisting: computed(
    'newColumnName',
    'oldDisplayedName',
    function isColumnLabelAlreadyExisting() {
      return (this.oldDisplayedName === undefined ||
          this.oldDisplayedName !== this.newColumnName) &&
        this.columnsConfiguration.checkIfDisplayedNameExist(this.newColumnName);
    }
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isColumnAlreadyExisting: computed(
    'newColumnName',
    'xattrKeyNameDropdownField.value',
    function isColumnAlreadyExisting() {
      return this.columnsConfiguration
        .tryCreateUniqueColumnKey(
          this.newColumnName,
          this.xattrKeyNameDropdownField.value,
          'xattr',
        ).exists === true;
    }
  ),

  actions: {
    goBack() {
      this.goBackAction();
    },
    editColumn() {
      this.editColumnAction(
        this.newColumnName,
        this.xattrKeyNameDropdownField.value,
        this.isNewColumn,
      );
    },
  },
});
