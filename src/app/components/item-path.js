/**
 * Renders path to browsable item (eg. file) taking archive membership into account.
 * The path is shortened if its too long to fit into container - to achieve it,
 * this is a block element, so it is recommended to render it as a flex container item.
 *
 * @module components/item-path
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, observer, get, getProperties } from '@ember/object';
import { reads } from '@ember/object/computed';
import { FilesViewContextFactory } from 'oneprovider-gui/utils/files-view-context';
import pathShorten from 'oneprovider-gui/utils/path-shorten';
import WindowResizeHandler from 'onedata-gui-common/mixins/components/window-resize-handler';
import { debounce, scheduleOnce, next } from '@ember/runloop';
import { promise, lte, or, array, raw } from 'ember-awesome-macros';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';

const datasetSeparator = '›';
const directorySeparator = '/';
const ellipsisString = '...';

const mixins = [
  I18n,
  WindowResizeHandler,
];

export default Component.extend(...mixins, {
  classNames: ['item-path'],

  i18n: service(),
  filesViewResolver: service(),
  datasetManager: service(),
  archiveManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.itemPath',

  /**
   * @type {Object} browsable object like file
   * @virtual
   */
  item: undefined,

  /**
   * @type {Function}
   * @virtual optional
   */
  onLinkClicked: undefined,

  /**
   * @type {Function}
   * @virtual optional
   */
  onLinkKeydown: undefined,

  /**
   * Anchor target attribute.
   * @type {String}
   */
  target: '_top',

  /**
   * Classname added to internal `<a>` element.
   * @type {String}
   */
  anchorClassName: 'path-anchor-default',

  displayedItemsCount: Number.MAX_SAFE_INTEGER,

  /**
   * Initialized on init - a bound rerefence to window resize handler.
   * @type {Function}
   */
  onWindowResizeFun: undefined,

  /**
   * Indicates that path length needs adjustments on next render.
   * If this flag is set to true, `didRender` will invoke path length adjustment.
   * @type {Boolean}
   */
  adjustmentNeeded: false,

  //#region asynchronous data

  itemPathProxy: promise.object(computed('item.parent', function itemPathProxy() {
    const item = this.get('item');
    return resolveFilePath(item);
  })),

  filesViewContextProxy: promise.object(computed('item', function filesViewContext() {
    const item = this.get('item');
    return FilesViewContextFactory.create({ ownerSource: this }).createFromFile(item);
  })),

  allItemsProxy: promise.array(computed(
    'itemPathProxy',
    'filesViewContextProxy',
    async function allItemsProxy() {
      const {
        datasetManager,
        archiveManager,
        filesViewContextProxy,
        itemPathProxy,
      } = this.getProperties(
        'datasetManager',
        'archiveManager',
        'filesViewContextProxy',
        'itemPathProxy',
      );
      const remainFiles = Array.from(
        get(itemPathProxy, 'content') || await itemPathProxy
      );
      const result = [];
      const {
        spaceId,
        datasetId,
        archiveId,
      } = getProperties(await filesViewContextProxy, 'spaceId', 'datasetId', 'archiveId');
      if (datasetId && archiveId) {
        const browsableDataset = await datasetManager.getBrowsableDataset(datasetId);
        const browsableArchive = await archiveManager.getBrowsableArchive(archiveId);
        // remove special directories from path
        remainFiles.splice(0, 4);
        result.push({
          itemType: 'dataset',
          icon: get(browsableDataset, 'rootFileType') === 'file' ?
            'browser-dataset-file' : 'browser-dataset',
          record: browsableDataset,
        });
        result.push({
          itemType: 'archive',
          icon: 'browser-archive',
          record: browsableArchive,
          separator: datasetSeparator,
        });
      } else if (spaceId) {
        const spaceRootDir = remainFiles[0];
        remainFiles.splice(0, 1);
        result.push({
          itemType: 'space',
          icon: 'space',
          record: spaceRootDir,
        });
      }
      const regularItems = remainFiles.map(file => {
        return {
          itemType: 'file',
          separator: directorySeparator,
          record: file,
        };
      });
      result.push(...regularItems);
      return result;
    }
  )),

  //#endregion

  isLoading: or('allItemsProxy.isPending', 'filesViewContextProxy.isPending'),

  isError: or('allItemsProxy.isRejected', 'filesViewContextProxy.isRejected'),

  filesViewContext: reads('filesViewContextProxy.content'),

  allItems: reads('allItemsProxy.content'),

  displayedItems: computed(
    'allItems.[]',
    'displayedItemsCount',
    function displayedItems() {
      const {
        allItems,
        displayedItemsCount,
      } = this.getProperties('allItems', 'displayedItemsCount');
      if (!allItems) {
        return [];
      }
      return pathShorten(
        allItems, {
          itemType: 'ellipsis',
          separator: directorySeparator,
          record: { name: ellipsisString },
        },
        displayedItemsCount
      );
    }
  ),

  stringifiedPath: computed('allItems', 'allNames.[]', function stringifiedPath() {
    const allItems = this.get('allItems');
    if (!allItems) {
      return;
    }
    const records = allItems.filterBy('record').mapBy('record');
    return stringifyFilePath(records);
  }),

  href: computed('item', 'filesViewContext', function href() {
    const {
      item,
      filesViewContext,
      filesViewResolver,
    } = this.getProperties('item', 'filesViewContext', 'filesViewResolver');
    if (!item || !filesViewContext) {
      return null;
    }
    return filesViewResolver.generateUrl(filesViewContext, 'select');
  }),

  renderTooltip: lte('displayedItemsCount', 'allItems.length'),

  allRecords: array.mapBy('allItems', raw('record')),

  allNames: array.mapBy('allRecords', raw('name')),

  allItemsObserver: observer('allItems.length', function allItemsObserver() {
    this.resetDisplayedItemsCount();
  }),

  displayedItemsObserver: observer(
    'displayedItems.[]',
    'allNames.[]',
    function displayedItemsObserver() {
      next(() => {
        let countDiff;
        if (!this.get('adjustmentNeeded')) {
          countDiff = this.resetDisplayedItemsCount();
        }
        this.set('adjustmentNeeded', true);
        if (countDiff && countDiff < 0) {
          this.scheduleUpdateView();
        }
      });
    }
  ),

  init() {
    this._super(...arguments);
    this.set('onWindowResizeFun', this.onWindowResize.bind(this));
  },

  /**
   * @override
   * @param {TransitionEvent|UIEvent} event
   */
  onWindowResize( /** event */ ) {
    if (!this.updatePathWidthInfo().changed) {
      return;
    }
    const countDiff = this.resetDisplayedItemsCount();
    this.set('adjustmentNeeded', true);
    if (countDiff < 0) {
      this.scheduleUpdateView();
    }
  },

  /**
   * @override
   */
  didInsertElement() {
    this._super(...arguments);
    const onWindowResizeFun = this.get('onWindowResizeFun');
    document.querySelector('body').addEventListener(
      'transitionend',
      onWindowResizeFun
    );
    this.get('allItemsProxy').then(() => {
      this.displayedItemsObserver();
    });
    // a hack to activate observers
    scheduleOnce('afterRender', () => {
      this.get('allNames');
    });
  },

  /**
   * @override
   */
  willDestroyElement() {
    this._super(...arguments);
    const onWindowResizeFun = this.get('onWindowResizeFun');
    document.querySelector('body').removeEventListener(
      'transitionend',
      onWindowResizeFun
    );
  },

  /**
   * @override
   */
  didRender() {
    this._super(...arguments);
    this.updateView();
  },

  /**
   * Should be invoked every time the view of componetn or its container view changes
   * somehow, eg.
   * - on `didRender` hook, because content of component changed
   * - on window resize
   * - on container size change
   */
  updateView() {
    this.adjustItemsCount();
  },

  /**
   * Debounces invocation of `updateView` to allow view settle down before computations
   * or handle multiple events fired at the same time or in very short period.
   * Originally written to prevent bug when multiple `transitionend` events were fired at
   * the same moment.
   */
  scheduleUpdateView() {
    debounce(this, 'updateView', 100);
  },

  resetDisplayedItemsCount() {
    if (!this.get('allItems')) {
      return;
    }
    const prevValue = this.get('allItems.length');
    const newValue = this.set('displayedItemsCount', prevValue + 1);
    return prevValue - newValue;
  },

  adjustItemsCount() {
    if (this.isPathOverflow()) {
      this.decrementProperty('displayedItemsCount');
    } else {
      this.set('adjustmentNeeded', false);
    }
  },

  isPathOverflow() {
    const {
      pathWidth,
      pathContainerWidth,
    } = this.updatePathWidthInfo();
    return pathWidth && pathWidth > pathContainerWidth || false;
  },

  updatePathWidthInfo() {
    const element = this.get('element');
    const pathContainer = element.querySelector('.path-container');
    const path = pathContainer.querySelector('.path');
    const pathWidth = path && path.clientWidth || 0;
    const pathContainerWidth = pathContainer.clientWidth;
    const changed = this.get('lastPathWidth') !== pathWidth ||
      this.get('lastPathContainerWidth') !== pathContainerWidth;
    if (changed) {
      this.setProperties({
        lastPathWidth: pathWidth,
        lastPathContainerWidth: pathContainerWidth,
      });
    }
    return {
      pathWidth,
      pathContainerWidth,
      changed,
    };
  },
});
