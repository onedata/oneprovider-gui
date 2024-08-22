/**
 * Renders columns configuration popover.
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { trySet, computed } from '@ember/object';
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

export default Component.extend(I18n, {
  classNames: ['columns-configuration-popover'],

  dragDrop: service(),
  i18n: service(),
  metadataManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.columnsConfigurationPopover',

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
   * @type {ComputedProperty<string>}
   */
  columnsCount: reads('columnsConfiguration.columnsOrder.length'),

  /**
   * @type {ComputedProperty<number>}
   */
  lastIndexColumn: computed('columnsCount', function lastIndexColumn() {
    return this.columnsCount - 1;
  }),

  selectedXattrOption: undefined,

  activeSlide: 'column-configuration',

  /**
   * @type {boolean}
   */
  isArrowTooltipVisible: true,

  /**
   * @type {Boolean}
   */
  isInFirefox: browser.name === BrowserName.Firefox,

  /**
   * Stores ids of currently edited inline editors.
   * @type {Object<SpaceConfiguration.InlineEditorFieldId, OneInlineCustomEditorApi>}
   */
  inlineEditorsApis: undefined,

  /**
   * @type {ComputedProperty<string>}
   */
  translationKey: reads('columnsConfiguration.translationKey'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isTargetForDrop: computed(
    'dragDrop.draggedElementModel',
    function isTargetForDrop() {
      const draggedElementModel = this.dragDrop.draggedElementModel;
      return draggedElementModel?.element.classList.contains('column-item');
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

  xattrKeyFieldName: 'xattrKey',

  xattrKeyModifiedFieldName: 'xattrKeyModified',

  /**
   * @returns {OneInlineCustomEditorApi}
   */
  getXattrKeyInlineEditorApi() {
    return this.inlineEditorsApis?.xattrKey;
  },

  filesList: computed('browserModel', function filesList() {
    const files = [];
    for (const file of this.browserModel.itemsArray.get('sourceArray').toArray()) {
      if (file && file.hasCustomMetadata) {
        files.push(file);
      }
    }
    return files;
  }),

  xattrsListProxy: computed('filesList', function xattrsListProxy() {
    return promiseObject(Promise.all(
      this.filesList.map(file =>
        this.metadataManager.getMetadata(file, 'xattrs', 'private'))
    ));
  }),

  xattrOptions: computed('xattrsListProxy.content', function xattrOptions() {
    const tmp = new Set();
    const result = [];
    if (this.xattrsListProxy.content) {
      for (const elem of this.xattrsListProxy.content) {
        for (const key in elem) {
          tmp.add(key);
        }
      }

      for (const elem of Array.from(tmp)) {
        result.push({ value: elem, label: elem });
      }
    }
    return result;
  }),

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

  xattrKeyModifiedNameField: computed('xattrKeyModifiedNameDropdownField',
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

  xattrColumnName: '',

  xattrKeyNameDropdownField: computed('xattrKeyNameOptions', function xattrKeyNameDropdownField() {
    return CustomValueDropdownField
      .extend({
        options: this.xattrKeyNameOptions,
        valueChanged(option) {
          this._super(...arguments);
          this.set('columnsConfigurationPopoverComponent.xattrColumnName', option);
        },
      })
      .create({
        columnsConfigurationPopoverComponent: this,
        name: this.xattrKeyFieldName,
        size: 'sm',
        isOptional: true,
      });
  }),

  xattrKeyModifiedNameDropdownField: computed('xattrKeyNameOptions',
    function xattrKeyModifiedNameDropdownField() {
      return CustomValueDropdownField
        .extend({
          options: this.xattrKeyNameOptions,
        })
        .create({
          columnsConfigurationPopoverComponent: this,
          name: this.xattrKeyModifiedFieldName,
          size: 'sm',
          isOptional: true,
        });
    }
  ),

  xattrKeyNameOptions: computed('xattrOptions',
    function xattrKeyNameOptions() {
      return this.xattrOptions ?? [];
    }
  ),

  isDisabledAddButton: computed(
    'xattrColumnName',
    'xattrKeyNameDropdownField.value',
    function isDisabledAddButton() {
      return !this.xattrColumnName || !this.xattrKeyNameDropdownField.value;
    }
  ),

  /**
   * @override
   */
  init() {
    this._super(...arguments);

    this.setProperties({
      blankInlineEditors: {},
      modifiedFields: new Set(),
      inlineEditorsApis: {},
    });
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
        'xattr',
      );
      this.set('activeSlide', 'column-configuration');
    },
    removeColumn(removedColumn) {
      this.columnsConfiguration.removeColumn(removedColumn);
    },
    acceptDraggedElement(index, draggedElement) {
      this.columnsConfiguration.moveColumn(draggedElement.columnName, index + 1);
      this.applyCurrentColumnsOrder();
    },
    validateDragEvent() {
      return this.get('isTargetForDrop');
    },
    goXattrConfiguration() {
      this.set('activeSlide', 'xattr-add');
      this.xattrKeyNameDropdownField.valueChanged('');
      this.set('xattrColumnName', '');
    },
    goXattrModify(columnName) {
      const xattrKey = this.columnsConfiguration.columns[columnName].xattrKey;
      this.xattrKeyModifiedNameDropdownField.valueChanged(xattrKey);
      this.set('activeSlide', 'xattr-modify');
      this.set('modifiedColumn', columnName);
      this.set(
        'modifiedColumnNewValue',
        this.columnsConfiguration.columns[columnName].displayedName
      );
    },
    goBack() {
      this.set('activeSlide', 'column-configuration');
      this.set('modifiedColumn', '');
    },
  },
});
