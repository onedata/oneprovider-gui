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
import { scheduleOnce } from '@ember/runloop';
import { promise, lte } from 'ember-awesome-macros';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import { inject as service } from '@ember/service';

const datasetSeparator = '›';
const directorySeparator = '/';
const ellipsisString = '...';

export default Component.extend(WindowResizeHandler, {
  classNames: ['item-path'],

  filesViewResolver: service(),
  datasetManager: service(),
  archiveManager: service(),

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

  anchorClassname: 'path-anchor-default',

  archiveId: undefined,

  datasetId: undefined,

  spaceId: undefined,

  archive: reads('archiveProxy.content'),

  displayedItemsCount: Number.MAX_SAFE_INTEGER,

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
        // FIXME: too low-level
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

  stringifiedPath: computed('allItems.[]', function stringifiedPath() {
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

  resetDisplayedItemsCount: observer('allItems.length', function resetDisplayedItemsCount() {
    if (!this.get('allItems')) {
      return;
    }
    this.set('displayedItemsCount', this.get('allItems.length') + 1);
  }),

  /**
   * @override
   */
  onWindowResize() {
    this.resetDisplayedItemsCount();
    scheduleOnce('afterRender', () => {
      this.adjustItemsCount();
    });
  },

  /**
   * @override
   */
  didInsertElement() {
    this._super(...arguments);
    this.attachWindowResizeHandler();
  },

  /**
   * @override
   */
  willRemoveElement() {
    this._super(...arguments);
    this.detachWindowResizeHandler();
  },

  /**
   * @override
   */
  didRender() {
    this._super(...arguments);
    this.adjustItemsCount();
  },

  adjustItemsCount() {
    const element = this.get('element');
    const pathContainer = element.querySelector('.path-container');
    const path = pathContainer.querySelector('.path');
    console.log(path.clientWidth, pathContainer.clientWidth);
    if (path.clientWidth > pathContainer.clientWidth) {
      this.decrementProperty('displayedItemsCount');
    }
  },
});
