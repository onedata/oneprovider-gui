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
import { Promise } from 'rsvp';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';
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
   * @type {string} One of: 'xattr-add', 'xattr-modify', 'column-configuration'
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
    editColumn(name, key, isNewColumn) {
      if (isNewColumn) {
        this.columnsConfiguration.addNewColumn(name, key, 'xattr');
      } else {
        this.columnsConfiguration.modifyColumn(this.modifiedColumn, name, key);
      }
      this.set('activeSlide', 'column-configuration');
    },
    removeXattrColumn(removedColumn) {
      this.columnsConfiguration.removeXattrColumn(removedColumn);
    },
    goXattrConfiguration() {
      this.set('activeSlide', 'xattr-add');
    },
    openXattrModification(columnName) {
      const xattrKey = this.columnsConfiguration.columns[columnName].xattrKey;
      this.setProperties({
        modifiedXattrKey: xattrKey,
        activeSlide: 'xattr-modify',
        modifiedColumn: columnName,
        modifiedDisplayedName: this.columnsConfiguration.columns[columnName]
          .displayedName,
      });
    },
    goBack() {
      this.set('activeSlide', 'column-configuration');
      this.set('modifiedColumn', '');
    },
  },
});
