/**
 * A class for modification visibility and order of columns in table.
 * The column's order and if column is enabled is save in local storage.
 * The visibility of columns depends of windows size and changes dynamically.
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { raw, gt } from 'ember-awesome-macros';
import globals from 'onedata-gui-common/utils/globals';
import WindowResizeHandler from 'onedata-gui-common/mixins/window-resize-handler';
import { htmlSafe } from '@ember/string';
import dom from 'onedata-gui-common/utils/dom';

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
  persistedConfigurationKey: '',

  /**
   * @virtual
   * @type {string}
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
   * @type {Object<string, ColumnProperties>}
   */
  columns: undefined,

  /**
   * An array with names of columns, in display order (from left to right).
   * There are enabled and disabled columns here.
   * @type {Object<string>}
   */
  columnsOrder: undefined,

  /**
   * @type {boolean}
   */
  isAnyColumnHidden: gt('hiddenColumnsCount', raw(0)),

  /**
   * @type {Object}
   */
  columnsStyle: computed('columns', function columnsStyle() {
    const styles = {};
    for (const column in this.columns) {
      styles[column] = htmlSafe(`--column-width: ${this.columns[column].width}px;`);
    }
    return styles;
  }),

  init() {
    this._super(...arguments);
    this.attachWindowResizeHandler();
    this.loadColumnsConfigFromLocalStorage();
    this.checkColumnsVisibility();
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
   * @param {string} column
   * @param {boolean} isEnabled
   * @returns {void}
   */
  changeColumnVisibility(columnName, isEnabled) {
    this.set(`columns.${columnName}.isEnabled`, isEnabled);
    this.checkColumnsVisibility();
    const enabledColumns = [];
    for (const column of this.columnsOrder) {
      if (this.columns[column].isEnabled) {
        enabledColumns.push(column);
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
    let width = this.defaultTableWidth;
    if (this.tableThead) {
      width = dom.width(this.tableThead);
    }
    let remainingWidth = width - this.firstColumnWidth;
    remainingWidth -= this.lastColumnWidth;
    let hiddenColumnsCount = 0;
    for (const column of this.columnsOrder) {
      if (this.columns[column].isEnabled) {
        if (remainingWidth >= this.columns[column].width) {
          remainingWidth -= this.columns[column].width;
          this.set(`columns.${column}.isVisible`, true);
        } else {
          this.set(`columns.${column}.isVisible`, false);
          hiddenColumnsCount += 1;
          remainingWidth = 0;
        }
      } else {
        this.set(`columns.${column}.isVisible`, false);
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
    const columnsOrder = globals.localStorage.getItem(
      `${this.persistedConfigurationKey}.columnsOrder`
    );

    const enabledColumnsList = enabledColumns?.split(',');
    if (enabledColumnsList) {
      for (const column in this.columns) {
        this.set(`columns.${column}.isEnabled`,
          Boolean(enabledColumnsList?.includes(column))
        );
      }
    }
    if (columnsOrder) {
      this.set('columnsOrder', columnsOrder.split(','));
    }
  },
});
