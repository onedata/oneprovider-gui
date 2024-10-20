/**
 * A class for visibility and order of columns modification in table.
 * The columns order and column enabled state is saved in the local storage.
 * The visibility of columns depends of browser window size and changes dynamically.
 *
 * The object is typically created in base browser model init using `create` and
 * then the `mount` is invoked with table head element when the element is rendered.
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/i18n';
import { raw, gt, bool } from 'ember-awesome-macros';
import globals from 'onedata-gui-common/utils/globals';
import WindowResizeHandler from 'onedata-gui-common/mixins/window-resize-handler';
import { htmlSafe } from '@ember/string';
import dom from 'onedata-gui-common/utils/dom';
import { reads } from '@ember/object/computed';
import { setProperties } from '@ember/object';

/**
 * Contains info about column visibility: if on screen is enough space to show this column
 * and if user want to view that
 * @typedef {EmberObject} ColumnProperties
 * @property {boolean} isVisible
 * @property {boolean} isEnabled
 * @property {number} width
 * @property {boolean} hasSubname
 * @property {boolean} hasTooltip
 * @property { 'basic' | 'xattr' } type Distinguishes whether this is one of the
 * default columns or a user-added xattr column.
 * @property {string} fileProperty Property that should be included in the file
 * requirement attributes when the column is enabled and visible.
 */

/**
 * Unique label of column in a table
 * @typedef {string} ColumnName
 */

const mixins = [
  I18n,
  WindowResizeHandler,
];

export default EmberObject.extend(...mixins, {
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.columnsConfiguration',

  /**
   * @virtual
   * @type {string}
   */
  configurationType: '',

  /**
   * @type {boolean}
   */
  hasXattrSettings: false,

  /**
   * @type {string}
   */
  persistedConfigurationKey: reads('configurationType'),

  /**
   * @type {string}
   */
  translationKey: computed(
    'configurationType',
    function translationKey() {
      return this.configurationType.split('.')[0];
    }
  ),

  /**
   * @virtual
   * @type {object}
   */
  tableThead: undefined,

  /**
   * @type {number}
   */
  defaultTableWidth: 1000,

  /**
   * @type {number}
   */
  firstColumnWidth: 380,

  /**
   * @type {number}
   */
  lastColumnWidth: 68,

  /**
   * @type {number}
   */
  hiddenColumnsCount: 0,

  /**
   * @type {Object<ColumnName, ColumnProperties>}
   */
  columns: undefined,

  /**
   * An array with names of columns, in display order (from left to right).
   * There are enabled and disabled columns here.
   * @type {Object<ColumnName>}
   */
  columnsOrder: undefined,

  /**
   * @type {Array}
   */
  listedFilesProperties: undefined,

  /**
   * @type {boolean}
   */
  isAnyColumnHidden: gt('hiddenColumnsCount', raw(0)),

  /**
   * @type {Object<ColumnName, SafeString>}
   */
  columnsStyle: computed('columns', function columnsStyle() {
    const styles = {};
    for (const columName in this.columns) {
      styles[columName] = htmlSafe(`--column-width: ${this.columns[columName].width}px;`);
    }
    return styles;
  }),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isMounted: bool('tableThead'),

  init() {
    this._super(...arguments);
    this.attachWindowResizeHandler();
    this.loadColumnsConfigFromLocalStorage();
    this.listFilesProperties();
  },

  /**
   * @override
   */
  willDestroy() {
    this._super(...arguments);
    this.detachWindowResizeHandler();
  },

  /**
   * @override
   */
  onWindowResize() {
    return this.checkColumnsVisibility();
  },

  /**
   * @param {HTMLElement} tableThead
   */
  mount(tableThead) {
    if (!tableThead) {
      return;
    }
    this.set('tableThead', tableThead);
    this.checkColumnsVisibility();
  },

  columnNameToVariable(columnName, type) {
    return type + '_' + columnName.replace(/ |,|\./g, '_');
  },

  persistedCustomColumnConfigKey(columnName) {
    return `${this.persistedConfigurationKey}.customColumns.${columnName}`;
  },

  /**
   * @param {ColumnName} columnName
   * @param {boolean} isEnabled
   * @returns {void}
   */
  changeColumnVisibility(columnName, isEnabled) {
    if (!(columnName in this.columns)) {
      return;
    }
    this.set(`columns.${columnName}.isEnabled`, isEnabled);
    this.checkColumnsVisibility();
    const enabledColumns = [];
    for (const columName of this.columnsOrder) {
      if (this.columns[columName]?.isEnabled) {
        enabledColumns.push(columName);
      }
    }
    this.notifyPropertyChange('columns');
    globals.localStorage.setItem(
      `${this.persistedConfigurationKey}.enabledColumns`,
      enabledColumns.join()
    );
  },

  addNewColumn(columnName, key, type) {
    let columnNameVariable = this.columnNameToVariable(columnName, type);

    // try to create name variable that does not exist or return
    // if column with the same key and displayed name exists
    while (columnNameVariable in this.columns) {
      if (
        columnName === this.columns[columnNameVariable].displayedName &&
        key === this.columns[columnNameVariable].xattrKey
      ) {
        // return if a column with the same name and key already exists
        return;
      }
      columnNameVariable += '#';
    }

    this.columns[columnNameVariable] = EmberObject.create({
      isVisible: false,
      isEnabled: false,
      width: 160,
      hasSubname: true,
      hasTooltip: true,
      type: type,
      xattrKey: key,
      displayedName: columnName,
      fileProperty: `xattr.${key}`,
    });
    globals.localStorage.setItem(
      `${this.persistedCustomColumnConfigKey(columnNameVariable)}.xattrKey`,
      key
    );
    globals.localStorage.setItem(
      `${this.persistedCustomColumnConfigKey(columnNameVariable)}.label`,
      columnName
    );
    this.columnsOrder.push(columnNameVariable);
    this.saveColumnsOrder();
    this.changeColumnVisibility(columnNameVariable, true);
    this.checkColumnsVisibility();
    this.notifyPropertyChange('columnsOrder');
  },

  removeXattrColumn(columnName) {
    this.changeColumnVisibility(columnName, false);
    delete this.columns[columnName];
    globals.localStorage.removeItem(
      `${this.persistedCustomColumnConfigKey(columnName)}.xattrKey`
    );
    globals.localStorage.removeItem(
      `${this.persistedCustomColumnConfigKey(columnName)}.label`
    );
    const index = this.columnsOrder.indexOf(columnName);
    if (index === -1) {
      return;
    }
    this.columnsOrder.splice(index, 1);
    this.saveColumnsOrder();
    this.checkColumnsVisibility();
    this.notifyPropertyChange('columnsOrder');
  },

  modifyColumn(columnName, newColumnName, key) {
    const column = this.get(`columns.${columnName}`);
    if (!column) {
      return;
    }
    setProperties(column, {
      displayedName: newColumnName,
      xattrKey: key,
      fileProperty: 'xattr.' + key,
    });

    globals.localStorage.setItem(
      `${this.persistedCustomColumnConfigKey(columnName)}.xattrKey`,
      key
    );
    globals.localStorage.setItem(
      `${this.persistedCustomColumnConfigKey(columnName)}.label`,
      newColumnName
    );

    this.checkColumnsVisibility();
  },

  saveColumnsOrder() {
    globals.localStorage.setItem(
      `${this.persistedConfigurationKey}.columnsOrder`,
      this.columnsOrder
    );
  },

  checkColumnsVisibility() {
    const tableContainer = this.tableThead?.parentElement?.parentElement;
    const tableContainerWidth = tableContainer ? dom.width(tableContainer) : 0;
    const tableHeadWidth = this.tableThead ? dom.width(this.tableThead) : 0;
    const elementWidth = tableContainerWidth ?
      Math.min(tableContainerWidth, tableHeadWidth) : tableHeadWidth;
    const width = elementWidth || this.defaultTableWidth;
    let remainingWidth = width - this.firstColumnWidth;
    remainingWidth -= this.lastColumnWidth;
    let hiddenColumnsCount = 0;
    for (const columName of this.columnsOrder) {
      const column = this.columns[columName];
      if (column) {
        if (column.isEnabled) {
          if (remainingWidth >= column.width) {
            remainingWidth -= column.width;
            this.set(`columns.${columName}.isVisible`, true);
          } else {
            this.set(`columns.${columName}.isVisible`, false);
            hiddenColumnsCount += 1;
            remainingWidth = 0;
          }
        } else {
          this.set(`columns.${columName}.isVisible`, false);
        }
      }
    }
    if (this.hiddenColumnsCount !== hiddenColumnsCount) {
      this.set('hiddenColumnsCount', hiddenColumnsCount);
    }
    this.listFilesProperties();
    this.notifyPropertyChange('columns');
  },

  loadXattrColumnFromLocalStorage(columnName, enabledColumnsList) {
    const xattrKey = globals.localStorage.getItem(
      `${this.persistedCustomColumnConfigKey(columnName)}.xattrKey`
    );
    const displayedName = globals.localStorage.getItem(
      `${this.persistedCustomColumnConfigKey(columnName)}.label`
    );
    if (!xattrKey || !displayedName) {
      return;
    }
    this.columns[columnName] = EmberObject.create({
      isVisible: false,
      isEnabled: Boolean(enabledColumnsList?.includes(columnName)),
      width: 160,
      hasSubname: true,
      hasTooltip: true,
      type: 'xattr',
      xattrKey,
      displayedName,
      fileProperty: `xattr.${xattrKey}`,
    });
  },

  loadColumnsConfigFromLocalStorage() {
    const enabledColumns = globals.localStorage.getItem(
      `${this.persistedConfigurationKey}.enabledColumns`
    );
    const enabledColumnsList = enabledColumns?.split(',');

    const columnsOrderFromLocalStorage = globals.localStorage.getItem(
      `${this.persistedConfigurationKey}.columnsOrder`
    );
    const columnsOrderListFromLocalStorage = columnsOrderFromLocalStorage?.split(',');

    const columnsOrderList = [];

    if (enabledColumnsList) {
      for (const columName in this.columns) {
        this.set(`columns.${columName}.isEnabled`,
          Boolean(enabledColumnsList?.includes(columName))
        );
      }
      for (const columnName of enabledColumnsList) {
        if (columnName.startsWith('xattr')) {
          this.loadXattrColumnFromLocalStorage(columnName, enabledColumnsList);
        }
      }
      if (columnsOrderListFromLocalStorage) {
        for (const columnName of columnsOrderListFromLocalStorage) {
          if (columnName.startsWith('xattr') && !(columnName in this.columns)) {
            this.loadXattrColumnFromLocalStorage(columnName, enabledColumnsList);
          }
        }
      }
    }

    if (columnsOrderListFromLocalStorage) {
      for (const columName of columnsOrderListFromLocalStorage) {
        if (this.columnsOrder.includes(columName) || columName.startsWith('xattr')) {
          columnsOrderList.push(columName);
        }
      }
      for (const columName of this.columnsOrder) {
        if (!columnsOrderList.includes(columName)) {
          columnsOrderList.push(columName);
        }
      }
      this.set('columnsOrder', columnsOrderList);
    }
  },

  moveColumn(columnName, newIndex) {
    const columnsOrder = this.columnsOrder;
    const indexOfColumn = columnsOrder.indexOf(columnName);
    let index = newIndex;

    if (indexOfColumn === -1 || newIndex > columnsOrder.length) {
      return;
    }
    const element = columnsOrder.splice(indexOfColumn, 1)[0];
    if (indexOfColumn < newIndex) {
      index -= 1;
    }
    columnsOrder.splice(index, 0, element);
  },
  listFilesProperties() {
    const filesProperties = [];
    const columnRequirementsEnableProperty = this.isMounted ?
      'isVisible' : 'isEnabled';
    const columns = this.columns;
    for (const column of Object.values(columns)) {
      if (column[columnRequirementsEnableProperty]) {
        filesProperties.push(column.fileProperty);
      }
    }
    this.set('listedFilesProperties', filesProperties);
    this.notifyPropertyChange('listedFilesProperties');
  },
});
