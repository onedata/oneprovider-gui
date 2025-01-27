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
  initialXattrKey: undefined,

  /**
   * @type {string}
   */
  newColumnName: '',

  /**
   * @type {string}
   */
  xattrKeyFieldName: 'xattrKey',

  xattrOptions: reads('xattrOptionsProxy.content'),

  xattrKeyRootField: destroyableComputed(
    'xattrKeyDropdownField',
    function xattrKeyRootField() {
      return FormFieldsRootGroup
        .create({
          ownerSource: this,
          columnEditorComponent: this,
          i18nPrefix: this.i18nPrefix,
          fields: [
            this.xattrKeyDropdownField,
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
    'xattrKeyDropdownField.value',
    function disabledEditButtonTooltip() {
      if (!this.newColumnName || !this.xattrKeyDropdownField.value) {
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
    function isColumnAlreadyExisting() {
      return this.columnsConfiguration
        .tryCreateUniqueColumnKey(
          this.newColumnName,
          this.xattrKeyDropdownField.value,
          'xattr',
        ).exists === true;
    }
  ),

  init() {
    initDestroyableCache(this);
    this._super(...arguments);
    this.set('newColumnName', this.initialDisplayedName);
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
      this.onSubmitColumn(
        this.newColumnName,
        this.xattrKeyDropdownField.value,
        this.isNewColumn,
      );
    },
  },
});
