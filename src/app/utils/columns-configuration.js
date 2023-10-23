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
import I18n from 'onedata-gui-common/mixins/components/i18n';
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

  /**
   * @param {ColumnName} columnName
   * @param {boolean} isEnabled
   * @returns {void}
   */
  changeColumnVisibility(columnName, isEnabled) {
    this.set(`columns.${columnName}.isEnabled`, isEnabled);
    this.checkColumnsVisibility();
    const enabledColumns = [];
    for (const columName of this.columnsOrder) {
      if (this.columns[columName].isEnabled) {
        enabledColumns.push(columName);
      }
    }
    this.notifyPropertyChange('columns');
    globals.localStorage.setItem(
      `${this.persistedConfigurationKey}.enabledColumns`,
      enabledColumns.join()
    );
  },

  saveColumnsOrder() {
    globals.localStorage.setItem(
      `${this.persistedConfigurationKey}.columnsOrder`,
      this.columnsOrder
    );
  },

  checkColumnsVisibility() {
    const width = this.tableThead ? dom.width(this.tableThead) : this.defaultTableWidth;
    let remainingWidth = width - this.firstColumnWidth;
    remainingWidth -= this.lastColumnWidth;
    let hiddenColumnsCount = 0;
    for (const columName of this.columnsOrder) {
      if (this.columns[columName].isEnabled) {
        if (remainingWidth >= this.columns[columName].width) {
          remainingWidth -= this.columns[columName].width;
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
    if (this.hiddenColumnsCount !== hiddenColumnsCount) {
      this.set('hiddenColumnsCount', hiddenColumnsCount);
    }
    this.notifyPropertyChange('columns');
  },

  loadColumnsConfigFromLocalStorage() {
    const enabledColumns = globals.localStorage.getItem(
      `${this.persistedConfigurationKey}.enabledColumns`
    );
    const enabledColumnsList = enabledColumns?.split(',');

    const columnsOrder = globals.localStorage.getItem(
      `${this.persistedConfigurationKey}.columnsOrder`
    );
    const columnsOrderList = columnsOrder?.split(',');

    if (enabledColumnsList) {
      for (const columName in this.columns) {
        this.set(`columns.${columName}.isEnabled`,
          Boolean(enabledColumnsList?.includes(columName))
        );
      }
    }
    if (columnsOrderList) {
      for (const columName of columnsOrderList) {
        if (!this.columnsOrder.includes(columName)) {
          console.log(columName);
          const index = columnsOrderList.indexOf(columName);
          columnsOrderList.splice(index, 1);
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
});
