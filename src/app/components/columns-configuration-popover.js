/**
 * Renders columns configuration popover.
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { trySet, computed, get } from '@ember/object';
import { next } from '@ember/runloop';
import browser, { BrowserName } from 'onedata-gui-common/utils/browser';
import { reads } from '@ember/object/computed';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/i18n';
import CustomValueDropdownField from 'onedata-gui-common/utils/form-component/custom-value-dropdown-field';
import FormFieldsRootGroup from 'onedata-gui-common/utils/form-component/form-fields-root-group';
import { Promise } from 'rsvp';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';
import DragAndDropColumnOrderMixin from 'oneprovider-gui/mixins/drag-and-drop-column-order';
import { bool } from '@ember/object/computed';

const mixins = [
  I18n,
  DragAndDropColumnOrderMixin,
];

export default Component.extend(...mixins, {
  classNames: ['columns-configuration-popover'],

  dragDrop: service(),
  i18n: service(),
  metadataManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.columnsConfigurationPopover',

  /**
   * @override
   */
  dragAndDropTagName: 'li',

  /**
   * @virtual
   * @type {string}
   */
  triggerSelector: undefined,

  /**
   * @virtual
   * @type {Utils.ColumnsConfiguration}
   */
  columnsConfiguration: undefined,

  /**
   * @virtual
   * @type {Utils.FilesystemBrowserModel}
   */
  browserModel: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  dragStartAction: notImplementedIgnore,

  /**
   * @virtual
   * @type {Function}
   */
  dragEndAction: notImplementedIgnore,

  /**
   * @virtual optional
   * @type {boolean}
   */
  isOpened: false,

  /**
   * @type {string}
   */
  modifiedColumn: '',

  /**
   * @type {string}
   */
  modifiedColumnNewValue: '',

  /**
   * Actual modified xattr key, used to display as the default value in the dropdown.
   * @type {string}
   */
  modifiedXattrKey: '',

  /**
   * @type {ComputedProperty<string>}
   */
  columnsCount: reads('columnsConfiguration.columnsOrder.length'),

  /**
   * @type {ComputedProperty<number>}
   */
  lastIndexColumn: computed('columnsCount', function lastIndexColumn() {
    return this.columnsCount - 1;
  }),

  /**
   * @type {string}
   */
  activeSlide: 'column-configuration',

  /**
   * @type {string}
   */
  xattrKeyFieldName: 'xattrKey',

  /**
   * @type {string}
   */
  xattrKeyModifiedFieldName: 'xattrKeyModified',

  /**
   * @type {string}
   */
  xattrColumnName: '',

  /**
   * @type {boolean}
   */
  isArrowTooltipVisible: true,

  /**
   * @type {Boolean}
   */
  isInFirefox: browser.name === BrowserName.Firefox,

  /**
   * @type {ComputedProperty<string>}
   */
  translationKey: reads('columnsConfiguration.translationKey'),

  /**
   * @type {ComputedProperty<boolean>}
   */
  hasXattrSettings: reads('columnsConfiguration.hasXattrSettings'),

  /**
   * @type {ComputedProperty<string>}
   */
  popoverStyle: computed('hasXattrSettings', function popoverStyle() {
    return 'columns-configuration' +
      (this.hasXattrSettings ? ' webui-popover-columns-configuration-with-xattrs' : '');
  }),

  xattrOptionsProxy: computed(
    'browserModel.itemsArray',
    'activeSlide',
    'isOpened',
    function xattrOptionsProxy() {
      if (!this.browserModel.itemsArray || !this.isOpened) {
        return promiseObject(resolve([]));
      }

      const files = get(this.browserModel.itemsArray, 'sourceArray').toArray();
      const filesWithXattrs = files.filter(file => file && get(file, 'hasCustomMetadata'));

      const promise = (async () => {
        const xattrsListPerFileProxy = await Promise.all(
          filesWithXattrs.map(file =>
            this.metadataManager.getMetadata(file, 'xattrs', 'private'))
        );
        const xattrs = new Set();
        const xattrsList = [];
        if (xattrsListPerFileProxy) {
          for (const xattrsFromSingleFile of xattrsListPerFileProxy) {
            for (const xattrKey in xattrsFromSingleFile) {
              xattrs.add(xattrKey);
            }
          }
          for (const xattr of Array.from(xattrs)) {
            xattrsList.push({ value: xattr, label: xattr });
          }
        }
        return xattrsList;
      })();

      return promiseObject(promise);
    }
  ),

  xattrOptions: reads('xattrOptionsProxy.content'),

  xattrKeyNameField: computed('xattrKeyNameDropdownField', function xattrKeyNameField() {
    return FormFieldsRootGroup
      .create({
        ownerSource: this,
        columnsConfigurationPopoverComponent: this,
        i18nPrefix: this.i18nPrefix,
        fields: [
          this.xattrKeyNameDropdownField,
        ],
      });
  }),

  xattrKeyModifiedNameField: computed(
    'xattrKeyModifiedNameDropdownField',
    function xattrKeyModifiedNameField() {
      return FormFieldsRootGroup
        .create({
          ownerSource: this,
          columnsConfigurationPopoverComponent: this,
          i18nPrefix: this.i18nPrefix,
          fields: [
            this.xattrKeyModifiedNameDropdownField,
          ],
        });
    }
  ),

  xattrKeyNameDropdownField: computed(
    'xattrOptions',
    function xattrKeyNameDropdownField() {
      return CustomValueDropdownField
        .extend({
          options: this.xattrOptions,
          valueChanged(option) {
            this._super(...arguments);
            if (this.oldValue === undefined ||
              this.oldValue === this.columnsConfigurationPopoverComponent.xattrColumnName
            ) {
              this.set('columnsConfigurationPopoverComponent.xattrColumnName', option);
            }
            this.set('oldValue', this.value);
          },
        })
        .create({
          columnsConfigurationPopoverComponent: this,
          name: this.xattrKeyFieldName,
          oldValue: undefined,
          size: 'sm',
          isOptional: true,
          injectedCustomValueInputPlaceholder: this.t('dropdownPlaceholder'),
          injectedCustomValueOptionTextPrefix: this.t('customKeyPlaceholder'),
        });
    }
  ),

  xattrKeyModifiedNameDropdownField: computed(
    'xattrOptions',
    'modifiedXattrKey',
    function xattrKeyModifiedNameDropdownField() {
      return CustomValueDropdownField
        .extend({
          options: this.xattrOptions,
          valueChanged(option) {
            this._super(...arguments);
            if (this.oldValue ===
              this.columnsConfigurationPopoverComponent.modifiedColumnNewValue
            ) {
              this.set(
                'columnsConfigurationPopoverComponent.modifiedColumnNewValue',
                option
              );
            }
            this.set('oldValue', this.value);
          },
        })
        .create({
          columnsConfigurationPopoverComponent: this,
          name: this.xattrKeyModifiedFieldName,
          oldValue: this.modifiedXattrKey,
          size: 'sm',
          isOptional: true,
          defaultValue: this.modifiedXattrKey,
          injectedCustomValueInputPlaceholder: this.t('dropdownPlaceholder'),
          injectedCustomValueOptionTextPrefix: this.t('customKeyPlaceholder'),
        });
    }
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isDisabledAddButton: bool('disabledAddButtonTooltip'),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  disabledAddButtonTooltip: computed(
    'isEmptyValueForAddedColumn',
    'isAddedColumnAlreadyExisting',
    'isAddedColumnLabelAlreadyExisting',
    function disabledAddButtonTooltip() {
      if (this.isEmptyValueForAddedColumn) {
        return this.t('emptyValueTooltip');
      }
      if (this.isAddedColumnAlreadyExisting) {
        return this.t('columnExistsTooltip');
      }
      if (this.isAddedColumnLabelAlreadyExisting) {
        return this.t('columnLabelExistsTooltip');
      }
      return '';
    }
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isEmptyValueForAddedColumn: computed(
    'xattrColumnName',
    'xattrKeyNameDropdownField.value',
    function isEmptyValueForAddedColumn() {
      return !this.xattrColumnName || !this.xattrKeyNameDropdownField.value;
    }
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isAddedColumnLabelAlreadyExisting: computed(
    'xattrColumnName',
    function isAddedColumnLabelAlreadyExisting() {
      return this.columnsConfiguration.checkIfDisplayedNameExist(this.xattrColumnName);
    }
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isAddedColumnAlreadyExisting: computed(
    'xattrColumnName',
    'xattrKeyNameDropdownField.value',
    function isAddedColumnAlreadyExisting() {
      return this.columnsConfiguration.tryCreateUniqueColumnKey(
        this.xattrColumnName,
        this.xattrKeyNameDropdownField.value,
        'xattr',
      ).exists === true;
    }
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isDisabledModifyButton: bool('disabledModifyButtonTooltip'),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  disabledModifyButtonTooltip: computed(
    'isEmptyValueForModifiedColumn',
    'isModifiedColumnAlreadyExisting',
    'isModifiedColumnLabelAlreadyExisting',
    function disabledModifyButtonTooltip() {
      if (this.isEmptyValueForModifiedColumn) {
        return this.t('emptyValueTooltip');
      }
      if (this.isModifiedColumnAlreadyExisting) {
        return this.t('columnExistsTooltip');
      }
      if (this.isModifiedColumnLabelAlreadyExisting) {
        return this.t('columnLabelExistsTooltip');
      }
      return '';
    }
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isEmptyValueForModifiedColumn: computed(
    'modifiedColumnNewValue',
    'xattrKeyModifiedNameDropdownField.value',
    function isEmptyValueForModifiedColumn() {
      return !this.modifiedColumnNewValue ||
        !this.xattrKeyModifiedNameDropdownField.value;
    }
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isModifiedColumnAlreadyExisting: computed(
    'modifiedColumnNewValue',
    'xattrKeyModifiedNameDropdownField.value',
    function isModifiedColumnAlreadyExisting() {
      return this.columnsConfiguration.tryCreateUniqueColumnKey(
        this.modifiedColumnNewValue,
        this.xattrKeyModifiedNameDropdownField.value,
        'xattr',
      ).exists === true;
    }
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isModifiedColumnLabelAlreadyExisting: computed(
    'modifiedColumn',
    'modifiedColumnNewValue',
    'columnsConfiguration.columns',
    function isModifiedColumnLabelAlreadyExisting() {
      const oldLabel = this.columnsConfiguration.columns[this.modifiedColumn]
        .displayedName;
      return oldLabel !== this.modifiedColumnNewValue &&
        this.columnsConfiguration.checkIfDisplayedNameExist(this.modifiedColumnNewValue);
    }
  ),

  applyCurrentColumnsOrder() {
    this.columnsConfiguration.saveColumnsOrder();
    this.columnsConfiguration.checkColumnsVisibility();
    this.columnsConfiguration.notifyPropertyChange('columnsOrder');
    // workaround to bug in firefox
    // tooltip not disappeared after click and move element
    if (this.isInFirefox) {
      this.set('isArrowTooltipVisible', false);
      next(() => trySet(this, 'isArrowTooltipVisible', true));
    }
  },

  actions: {
    checkboxChanged(columnName, newValue) {
      this.columnsConfiguration.changeColumnVisibility(columnName, newValue);
    },
    moveColumnDown(columnName) {
      const columnsOrder = this.columnsConfiguration.columnsOrder;
      const indexOfColumn = columnsOrder.indexOf(columnName);

      if (indexOfColumn === -1 || indexOfColumn + 1 >= columnsOrder.length) {
        return;
      }

      const columnToSwitch = columnsOrder[indexOfColumn + 1];
      columnsOrder[indexOfColumn + 1] = columnName;
      columnsOrder[indexOfColumn] = columnToSwitch;
      this.applyCurrentColumnsOrder();
    },
    moveColumnUp(columnName) {
      const columnsOrder = this.columnsConfiguration.columnsOrder;
      const indexOfColumn = columnsOrder.indexOf(columnName);

      if (indexOfColumn === -1 || indexOfColumn <= 0) {
        return;
      }

      if (indexOfColumn - 1 >= 0) {
        const columnToSwitch = columnsOrder[indexOfColumn - 1];
        columnsOrder[indexOfColumn - 1] = columnName;
        columnsOrder[indexOfColumn] = columnToSwitch;
        this.applyCurrentColumnsOrder();
      }
    },
    addNewColumn() {
      const newColumn = this.xattrColumnName;
      const key = this.xattrKeyNameDropdownField.value;
      this.columnsConfiguration.addNewColumn(newColumn, key, 'xattr');
      this.set('activeSlide', 'column-configuration');
    },
    modifyColumn() {
      const key = this.xattrKeyModifiedNameDropdownField.value;
      this.columnsConfiguration.modifyColumn(
        this.modifiedColumn,
        this.modifiedColumnNewValue,
        key,
      );
      this.set('activeSlide', 'column-configuration');
    },
    removeXattrColumn(removedColumn) {
      this.columnsConfiguration.removeXattrColumn(removedColumn);
    },
    goXattrConfiguration() {
      this.set('activeSlide', 'xattr-add');
      this.set('xattrColumnName', '');
    },
    openXattrModification(columnName) {
      const xattrKey = this.columnsConfiguration.columns[columnName].xattrKey;
      this.setProperties({
        modifiedXattrKey: xattrKey,
        activeSlide: 'xattr-modify',
        modifiedColumn: columnName,
        modifiedColumnNewValue: this.columnsConfiguration.columns[columnName]
          .displayedName,
      });
    },
    goBack() {
      this.set('activeSlide', 'column-configuration');
      this.set('modifiedColumn', '');
    },
  },
});
