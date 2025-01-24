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
  oldDisplayedName: '',

  /**
   * @virtual optional
   * @type {string}
   */
  oldXattrKey: undefined,

  /**
   * @type {string}
   */
  newColumnName: '',

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
          options: this.xattrOptions,
          columnEditorComponent: this,
          name: this.xattrKeyFieldName,
          oldValue: this.oldXattrKey,
          defaultValue: this.oldXattrKey,
          size: 'sm',
          isOptional: true,
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
    'isColumnAlreadyExisting',
    'isColumnLabelAlreadyExisting',
    'newColumnName',
    'xattrKeyNameDropdownField.value',
    function disabledEditButtonTooltip() {
      if (!this.newColumnName || !this.xattrKeyNameDropdownField.value) {
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
    'oldDisplayedName',
    function isColumnLabelAlreadyExisting() {
      return (
        this.oldDisplayedName === undefined ||
        this.oldDisplayedName !== this.newColumnName
      ) && this.columnsConfiguration.checkIfDisplayedNameExist(this.newColumnName);
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

  init() {
    this._super(...arguments);
    this.set('newColumnName', this.oldDisplayedName);
  },

  actions: {
    goBack() {
      this.onGoBack();
    },
    editColumn() {
      this.onSubmitColumn(
        this.newColumnName,
        this.xattrKeyNameDropdownField.value,
        this.isNewColumn,
      );
    },
  },
});
