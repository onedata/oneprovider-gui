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
  hasMetadataSettings: false,

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

  tryCreateUniqueColumnKey(columnName, option, type) {
    let columnNameVariable = this.columnNameToVariable(columnName, type);

    // try to create name variable that does not exist or return
    // if column with the same key and displayed name exists
    while (columnNameVariable in this.columns) {
      if (
        type === 'xattr' &&
        columnName === this.columns[columnNameVariable].displayedName &&
        option.xattrKey === this.columns[columnNameVariable].xattrKey
      ) {
        // return if a column with the same name and key already exists
        return { exists: true };
      } else if (
        type === 'json' &&
        columnName === this.columns[columnNameVariable].displayedName &&
        option.queryType === this.columns[columnNameVariable].queryType &&
        option.jsonKey === this.columns[columnNameVariable].jsonKey
      ) {
        // return if a column with the same name and query type already exists
        return { exists: true };
      }
      columnNameVariable += '#';
    }
    return { exists: false, uniqueName: columnNameVariable };
  },

  checkIfDisplayedNameExist(columnName) {
    return Object.values(this.columns).filter(
      (column) => column.displayedName === columnName
    ).length > 0;
  },

  addNewColumn(columnName, option, type) {
    const newColumnInfo = this.tryCreateUniqueColumnKey(columnName, option, type);
    if (newColumnInfo.exists === true) {
      return;
    }
    const columnNameVariable = newColumnInfo.uniqueName;

    if (type === 'xattr') {
      this.columns[columnNameVariable] = EmberObject.create({
        isVisible: false,
        isEnabled: false,
        width: 160,
        hasSubname: true,
        hasTooltip: true,
        type: type,
        xattrKey: option.xattrKey,
        displayedName: columnName,
        fileProperty: `xattr.${option.xattrKey}`,
      });
      globals.localStorage.setItem(
        `${this.persistedCustomColumnConfigKey(columnNameVariable)}.xattrKey`,
        option.xattrKey
      );
    } else {
      this.columns[columnNameVariable] = EmberObject.create({
        isVisible: false,
        isEnabled: false,
        width: 210,
        hasSubname: true,
        hasTooltip: true,
        type: type,
        queryType: option.queryType,
        jsonKey: option.jsonKey,
        displayedName: columnName,
        fileProperty: 'jsonMetadata',
      });
      globals.localStorage.setItem(
        `${this.persistedCustomColumnConfigKey(columnNameVariable)}.queryType`,
        option.queryType
      );
      if (option.queryType === 'key') {
        globals.localStorage.setItem(
          `${this.persistedCustomColumnConfigKey(columnNameVariable)}.jsonKey`,
          option.jsonKey
        );
      }
    }

    globals.localStorage.setItem(
      `${this.persistedCustomColumnConfigKey(columnNameVariable)}.label`,
      columnName
    );
    this.columnsOrder.push(columnNameVariable);
    this.saveColumnsOrder();
    this.changeColumnVisibility(columnNameVariable, true);
    this.checkColumnsVisibility();
    this.notifyPropertyChange('columnsOrder');
    return columnNameVariable;
  },

  removeMetadataColumn(columnName) {
    this.changeColumnVisibility(columnName, false);
    const type = this.columns[columnName].type;
    if (type === 'xattr') {
      globals.localStorage.removeItem(
        `${this.persistedCustomColumnConfigKey(columnName)}.xattrKey`
      );
    } else {
      const queryType = this.columns[columnName].queryType;
      globals.localStorage.removeItem(
        `${this.persistedCustomColumnConfigKey(columnName)}.queryType`
      );
      if (queryType === 'key') {
        globals.localStorage.removeItem(
          `${this.persistedCustomColumnConfigKey(columnName)}.jsonKey`
        );
      }
    }
    delete this.columns[columnName];
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

  modifyColumn(columnName, newColumnName, option, type) {
    const column = this.get(`columns.${columnName}`);
    if (!column) {
      return;
    }
    const isEnabled = column.isEnabled;
    const index = this.columnsOrder.indexOf(columnName);
    this.removeMetadataColumn(columnName);
    const newColumnNameVariable = this.addNewColumn(newColumnName, option, type);

    this.moveColumn(newColumnNameVariable, index);
    this.saveColumnsOrder();
    this.notifyPropertyChange('columnsOrder');
    this.changeColumnVisibility(newColumnNameVariable, isEnabled);
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

  loadJsonColumnFromLocalStorage(columnName, enabledColumnsList) {
    const queryType = globals.localStorage.getItem(
      `${this.persistedCustomColumnConfigKey(columnName)}.queryType`
    );
    let jsonKey = '';
    if (queryType === 'key') {
      jsonKey = globals.localStorage.getItem(
        `${this.persistedCustomColumnConfigKey(columnName)}.jsonKey`
      );
    }
    const displayedName = globals.localStorage.getItem(
      `${this.persistedCustomColumnConfigKey(columnName)}.label`
    );
    if (!queryType || !displayedName) {
      return;
    }
    this.columns[columnName] = EmberObject.create({
      isVisible: false,
      isEnabled: Boolean(enabledColumnsList?.includes(columnName)),
      width: 210,
      hasSubname: true,
      hasTooltip: true,
      type: 'json',
      queryType,
      jsonKey,
      displayedName,
      fileProperty: 'jsonMetadata',
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
        } else if (columnName.startsWith('json')) {
          this.loadJsonColumnFromLocalStorage(columnName, enabledColumnsList);
        }
      }
      if (columnsOrderListFromLocalStorage) {
        for (const columnName of columnsOrderListFromLocalStorage) {
          if (columnName.startsWith('xattr') && !(columnName in this.columns)) {
            this.loadXattrColumnFromLocalStorage(columnName, enabledColumnsList);
          } else if (columnName.startsWith('json') && !(columnName in this.columns)) {
            this.loadJsonColumnFromLocalStorage(columnName, enabledColumnsList);
          }
        }
      }
    }

    if (columnsOrderListFromLocalStorage) {
      for (const columName of columnsOrderListFromLocalStorage) {
        if (
          this.columnsOrder.includes(columName) ||
          columName.startsWith('xattr') ||
          columName.startsWith('json')
        ) {
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
    const filesProperties = new Set();
    const columnRequirementsEnableProperty = this.isMounted ?
      'isVisible' : 'isEnabled';
    const columns = this.columns;
    for (const column of Object.values(columns)) {
      if (column[columnRequirementsEnableProperty]) {
        filesProperties.add(column.fileProperty);
      }
    }
    this.set('listedFilesProperties', [...filesProperties]);
    this.notifyPropertyChange('listedFilesProperties');
  },
});
