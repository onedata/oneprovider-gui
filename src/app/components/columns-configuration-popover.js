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
import { Promise, resolve } from 'rsvp';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import DragAndDropColumnOrderMixin from 'oneprovider-gui/mixins/drag-and-drop-column-order';

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
  modifiedDisplayedName: '',

  /**
   * @type {ColumnType}
   */
  modifiedMetadataType: '',

  /**
   * Actual modified xattr key, used to display as the default value in the dropdown.
   * @type {string}
   */
  modifiedXattrKey: '',

  /**
   * Actual modified JSON query type, used to display as the default value in radio buttons.
   * @type {JsonQueryType}
   */
  modifiedJsonQueryType: '',

  /**
   * @type {string}
   */
  modifiedJsonKey: '',

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
   * @type {'column-add'|'column-modify'|'column-configuration'}
   */
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
   * @type {ComputedProperty<string>}
   */
  translationKey: reads('columnsConfiguration.translationKey'),

  /**
   * @type {ComputedProperty<boolean>}
   */
  hasMetadataSettings: reads('columnsConfiguration.hasMetadataSettings'),

  /**
   * @type {ComputedProperty<string>}
   */
  popoverStyle: computed('hasMetadataSettings', function popoverStyle() {
    return 'columns-configuration' +
      (this.hasMetadataSettings ?
        ' webui-popover-columns-configuration-with-metadata' : ''
      );
  }),

  /**
   * @type {PromiseObject<Array<{value: string, label: string}>>}
   */
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
      const scope = this.browserModel.previewMode ? 'public' : 'private';

      const promise = (async () => {
        const xattrsListPerFileProxy = await Promise.all(
          filesWithXattrs.map(file =>
            this.metadataManager.getMetadata(file, 'xattrs', scope))
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
        return xattrsList.sortBy('label');
      })();

      return promiseObject(promise);
    }
  ),

  /**
   * @type {PromiseObject<Array<{value: string, label: string}>>}
   */
  jsonKeyOptionsProxy: computed(
    'browserModel.itemsArray',
    'activeSlide',
    'isOpened',
    function jsonKeyOptionsProxy() {
      if (!this.browserModel.itemsArray || !this.isOpened) {
        return promiseObject(resolve([]));
      }

      const files = get(this.browserModel.itemsArray, 'sourceArray').toArray();
      const filesWithMetadata = files.filter(file => file && get(file, 'hasCustomMetadata'));
      const scope = this.browserModel.previewMode ? 'public' : 'private';

      const promise = (async () => {
        const jsonListPerFileProxy = await Promise.all(
          filesWithMetadata.map(file =>
            this.metadataManager.getMetadata(file, 'json', scope))
        );
        const jsonKeys = new Set();
        const jsonKeysList = [];
        if (jsonListPerFileProxy) {
          for (const jsonFromSingleFile of jsonListPerFileProxy) {
            for (const key of Object.keys(JSON.parse(jsonFromSingleFile))) {
              jsonKeys.add(key);
            }
          }
          for (const key of Array.from(jsonKeys)) {
            jsonKeysList.push({ value: key, label: key });
          }
        }
        return jsonKeysList.sortBy('label');
      })();

      return promiseObject(promise);
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
    submitColumn(isNewColumn, type, name, options) {
      if (isNewColumn) {
        this.columnsConfiguration.addNewColumn(name, options, type);
      } else {
        this.columnsConfiguration.modifyColumn(this.modifiedColumn, name, options, type);
      }
      this.set('activeSlide', 'column-configuration');
    },
    removeMetadataColumn(removedColumn) {
      this.columnsConfiguration.removeMetadataColumn(removedColumn);
    },
    goXattrConfiguration() {
      this.set('activeSlide', 'column-add');
    },
    openColumnEditor(columnName) {
      const columnInfo = this.columnsConfiguration.columns[columnName];
      this.setProperties({
        activeSlide: 'column-modify',
        modifiedColumn: columnName,
        modifiedMetadataType: columnInfo.type,
        modifiedDisplayedName: columnInfo.displayedName,
      });
      if (columnInfo.type === 'xattr') {
        this.set(
          'modifiedXattrKey',
          columnInfo.options.xattrKey
        );
      } else {
        const queryType = columnInfo.options.queryType;
        this.set(
          'modifiedJsonQueryType',
          queryType
        );
        if (queryType === 'key') {
          this.set(
            'modifiedJsonKey',
            columnInfo.options.jsonKey
          );
        }
      }
    },
    goBack() {
      this.set('activeSlide', 'column-configuration');
      this.set('modifiedColumn', '');
    },
  },
});
