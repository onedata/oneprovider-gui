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

/**
 * Contains info about column visibility: if on screen is enough space to show this column
 * and if user want to view that
 * @typedef {EmberObject} ColumnProperties
 * @property {boolean} isVisible
 * @property {boolean} isEnabled
 * @property {number} width
 * @property {boolean} hasSubname
 * @property {boolean} hasTooltip
 * @property {ColumnType} type Distinguishes whether this is one of the
 *   default columns or a user-added metadata column.
 * @property {string} displayedName If this is a user-added metadata column,
 *   this string is used as the column label.
 * @property {XattrColumnOptions|JsonColumnOptions|undefined} options
 * @property {string} fileProperty Property that should be included in the file
 *   requirement attributes when the column is enabled and visible.
 */

/**
 * Determines how JSON data should be queried.
 * - all: Returns the entire JSON object.
 * - key: Returns the value of the top-level key in the JSON hierarchy.
 * @typedef {'all'|'key'|'query'} JsonQueryType
 */

/**
 * Distinguishes whether this is one of the
 * default columns or a user - added metadata column.
 * @typedef {'basic'|'xattr'|'json'} ColumnType
 */

/**
 * @typedef {Object} XattrColumnOptions
 * @property {string} xattrKey
 */

/**
 * @typedef {Object} JsonColumnOptions
 * @property {JsonQueryType} queryType Determines how JSON data should be queried.
 * @property {string} [jsonKey] Name of the top-level key in the JSON hierarchy.
 *   This applies only if the queryType is 'key'.
 * @property { string } [jsonQuery] stores a string written in JSONata syntax,
 *   used to extract specific data from a JSON object.
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
    for (const columnName in this.columns) {
      styles[columnName] = htmlSafe(`--column-width: ${this.columns[columnName].width}px;`);
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

  /**
   * @param {ColumnName} columnName
   * @param {XattrColumnOptions|JsonColumnOptions} options
   * @param {ColumnType} type
   * @returns {{exists: boolean, uniqueName: string}}
   */
  tryCreateUniqueColumnKey(columnName, options, type) {
    let columnNameVariable = this.columnNameToVariable(columnName, type);

    // try to create name variable that does not exist or return
    // if column with the same key and displayed name exists
    while (columnNameVariable in this.columns) {
      const column = this.columns[columnNameVariable];
      if (
        type === 'xattr' &&
        columnName === column.displayedName &&
        options.xattrKey === column.options.xattrKey
      ) {
        // return if a column with the same name and key already exists
        return { exists: true };
      } else if (
        type === 'json' &&
        columnName === column.displayedName &&
        options.queryType === column.options.queryType &&
        options.jsonKey === column.options.jsonKey &&
        options.jsonQuery === column.options.jsonQuery
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

  /**
   * @param {ColumnName} columnName
   * @param {XattrColumnOptions|JsonColumnOptions} options
   * @param {ColumnType} type
   * @returns {string}
   */
  addNewColumn(columnName, options, type) {
    const newColumnInfo = this.tryCreateUniqueColumnKey(columnName, options, type);
    if (newColumnInfo.exists === true) {
      return;
    }
    const columnNameVariable = newColumnInfo.uniqueName;
    let specificOptions = {};

    if (type === 'xattr') {
      specificOptions = {
        width: 160,
        options: {
          xattrKey: options.xattrKey,
        },
        fileProperty: `xattr.${options.xattrKey}`,
      };
      globals.localStorage.setItem(
        `${this.persistedCustomColumnConfigKey(columnNameVariable)}.xattrKey`,
        options.xattrKey
      );
    } else {
      specificOptions = {
        width: 210,
        options: {
          queryType: options.queryType,
          jsonKey: options.jsonKey,
          jsonQuery: options.jsonQuery,
        },
        fileProperty: 'jsonMetadata',
      };
      globals.localStorage.setItem(
        `${this.persistedCustomColumnConfigKey(columnNameVariable)}.queryType`,
        options.queryType
      );
      if (options.queryType === 'key') {
        globals.localStorage.setItem(
          `${this.persistedCustomColumnConfigKey(columnNameVariable)}.jsonKey`,
          options.jsonKey
        );
      }
      if (options.queryType === 'query') {
        globals.localStorage.setItem(
          `${this.persistedCustomColumnConfigKey(columnNameVariable)}.jsonQuery`,
          options.jsonQuery
        );
      }
    }
    this.columns[columnNameVariable] = EmberObject.create({
      isVisible: false,
      isEnabled: false,
      hasSubname: true,
      hasTooltip: true,
      type: type,
      displayedName: columnName,
      ...specificOptions,
    });

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
      const queryType = this.columns[columnName].options.queryType;
      globals.localStorage.removeItem(
        `${this.persistedCustomColumnConfigKey(columnName)}.queryType`
      );
      if (queryType === 'key') {
        globals.localStorage.removeItem(
          `${this.persistedCustomColumnConfigKey(columnName)}.jsonKey`
        );
      }
      if (queryType === 'query') {
        globals.localStorage.removeItem(
          `${this.persistedCustomColumnConfigKey(columnName)}.jsonQuery`
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

  modifyColumn(columnName, newColumnName, options, type) {
    const column = this.get(`columns.${columnName}`);
    if (!column) {
      return;
    }
    const isEnabled = column.isEnabled;
    const index = this.columnsOrder.indexOf(columnName);
    this.removeMetadataColumn(columnName);
    const newColumnNameVariable = this.addNewColumn(newColumnName, options, type);

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
      options: {
        xattrKey,
      },
      displayedName,
      fileProperty: `xattr.${xattrKey}`,
    });
  },

  loadJsonColumnFromLocalStorage(columnName, enabledColumnsList) {
    const queryType = globals.localStorage.getItem(
      `${this.persistedCustomColumnConfigKey(columnName)}.queryType`
    );
    let jsonKey = '';
    let jsonQuery = '';
    if (queryType === 'key') {
      jsonKey = globals.localStorage.getItem(
        `${this.persistedCustomColumnConfigKey(columnName)}.jsonKey`
      );
    }
    if (queryType === 'query') {
      jsonQuery = globals.localStorage.getItem(
        `${this.persistedCustomColumnConfigKey(columnName)}.jsonQuery`
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
      options: {
        queryType,
        jsonKey,
        jsonQuery,
      },
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
      for (const columnName in this.columns) {
        this.set(`columns.${columnName}.isEnabled`,
          Boolean(enabledColumnsList?.includes(columnName))
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
    if (filesProperties.has('jsonMetadata')) {
      filesProperties.add('hasJsonMetadata');
    }
    this.set('listedFilesProperties', [...filesProperties]);
    this.notifyPropertyChange('listedFilesProperties');
  },
});
