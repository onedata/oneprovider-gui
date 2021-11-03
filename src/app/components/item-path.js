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
import { debounce } from '@ember/runloop';
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
  anchorClassname: 'path-anchor-default',

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
      } = this.getProperties(
        'datasetManager',
        'archiveManager',
        'filesViewContextProxy'
      );
      const remainFiles = Array.from(this.get('itemPathProxy.content') || await this.get('itemPathProxy'));
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

  resetDisplayedItemsCount: observer('allItems.length', function resetDisplayedItemsCount() {
    if (!this.get('allItems')) {
      return;
    }
    const prevValue = this.get('allItems.length');
    const newValue = this.set('displayedItemsCount', prevValue + 1);
    return prevValue - newValue;
  }),

  init() {
    this._super(...arguments);
    this.set('onWindowResizeFun', this.onWindowResize.bind(this));
  },

  /**
   * @override
   * @param {TransitionEvent|UIEvent} event
   */
  onWindowResize(event) {
    if (
      event &&
      event.type === 'transitionend' && !['width', 'height'].includes(event.propertyName)
    ) {
      return;
    }
    const countDiff = this.resetDisplayedItemsCount();
    this.set('adjustmentNeeded', true);
    if (countDiff < 0) {
      // prevents bug when two events (eg. transitionend) are fired at the same moment
      debounce(this, 'didRender', 100);
    }
  },

  /**
   * @override
   */
  didInsertElement() {
    this._super(...arguments);
    this.attachWindowResizeHandler();
    const onWindowResizeFun = this.get('onWindowResizeFun');
    document.querySelector('body').addEventListener(
      'transitionend',
      onWindowResizeFun
    );
    this.get('allItemsProxy').then(() => {
      this.displayedItemsObserver();
    });
  },

  /**
   * @override
   */
  willDestroyElement() {
    this._super(...arguments);
    this.detachWindowResizeHandler();
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
    this.adjustItemsCount();
  },

  displayedItemsObserver: observer(
    'displayedItems.[]',
    'allNames.[]',
    function displayedItemsObserver() {
      let countDiff;
      if (!this.get('adjustmentNeeded')) {
        countDiff = this.resetDisplayedItemsCount();
      }
      this.set('adjustmentNeeded', true);
      if (countDiff && countDiff < 0) {
        debounce(this, 'didRender', 100);
      }
    }
  ),

  adjustItemsCount() {
    const element = this.get('element');
    const pathContainer = element.querySelector('.path-container');
    const path = pathContainer.querySelector('.path');
    if (path && path.clientWidth > pathContainer.clientWidth) {
      this.decrementProperty('displayedItemsCount');
    } else {
      this.set('adjustmentNeeded', false);
    }
  },
});
