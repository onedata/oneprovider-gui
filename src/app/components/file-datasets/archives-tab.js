/**
 * A container for archives browser embedded into file-datasets panel.
 *
 * @module components/items-select-browser
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { observer, computed, get, set } from '@ember/object';
import { reads } from '@ember/object/computed';
import { all as allFulfilled } from 'rsvp';
import { guidFor } from '@ember/object/internals';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import defaultResolveParent from 'oneprovider-gui/utils/default-resolve-parent';
import ItemBrowserContainerBase from 'oneprovider-gui/mixins/item-browser-container-base';
import InModalBrowserContainerBase from 'oneprovider-gui/mixins/in-modal-item-browser-container-base';
import ArchiveBrowserModel from 'oneprovider-gui/utils/archive-browser-model';
import { promise, conditional, raw } from 'ember-awesome-macros';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';

const mixins = [
  I18n,
  ItemBrowserContainerBase,
  InModalBrowserContainerBase,
];

export default Component.extend(...mixins, {
  classNames: ['file-datasets-archives-tab'],

  archiveManager: service(),

  /**
   * @type {Models.Space}
   * @virtual
   */
  space: undefined,

  /**
   * @type {Models.Dataset}
   * @virtual
   */
  dataset: undefined,

  /**
   * Custom selector for items list scroll container.
   * Should be overriden **only** if archives-tab is not in one-modal.
   * @virtual optional
   */
  contentScrollSelector: undefined,

  /**
   * @implements ItemBrowserContainerBase
   */
  selectedItems: undefined,

  /**
   * Managed by `switchBrowserModel` observer.
   * @type {Utils.BaseBrowserModel}
   */
  browserModel: undefined,

  /**
   * Entity ID of directory (file model).
   * @type {String}
   */
  dirId: undefined,

  /**
   * One of: archives, files.
   * @type {String}
   */
  viewMode: conditional(
    'dirId',
    raw('files'),
    raw('archives'),
  ),

  /**
   * @implements ItemBrowserContainerBase
   */
  dirProxy: promise.object(computed(
    'dirId',
    'dataset',
    async function dirProxy() {
      const {
        dirId,
        dataset,
      } = this.getProperties('dirId', 'dataset');
      if (dirId) {
        // FIXME: dir support
        throw new Error('dir support not implemented');
      } else {
        return dataset;
      }
    }
  )),

  dir: computedLastProxyContent('dirProxy'),

  /**
   * Proxy for whole file-browser: loading causes loading screen, recomputing causes
   * `file-browser` to be re-rendered.
   * @type {PromiseObject}
   */
  initialRequiredDataProxy: reads('initiaDirProxy'),

  /**
   * @implements ArchiveBrowserModel.spaceDatasetsViewState
   */
  browsableDataset: computed('dataset', function browsableDataset() {
    const {
      datasetManager,
      dataset,
    } = this.getProperties('datasetManager', 'dataset');

    return datasetManager.getBrowsableDataset(get(dataset, 'entityId'));
  }),

  /**
   * @implements ArchiveBrowserModel.spaceDatasetsViewState
   */
  attachmentState: 'attached',

  switchBrowserModel: observer('viewMode', function switchBrowserModel() {
    const {
      viewMode,
      browserModel: currentBrowserModel,
    } = this.getProperties('viewMode', 'browserModel');
    let newBrowserModel;
    switch (viewMode) {
      case 'files':
        throw new Error('not implemented viewMode files');
      case 'archives':
        newBrowserModel = this.createArchiveBrowserModel();
        break;
    }
    this.set('browserModel', newBrowserModel);
    if (currentBrowserModel) {
      currentBrowserModel.destroy();
    }
  }),

  init() {
    this._super(...arguments);
    this.switchBrowserModel();
  },

  willDestroyElement() {
    try {
      const browserModel = this.get('browserModel');
      if (browserModel) {
        browserModel.destroy();
      }
    } finally {
      this._super(...arguments);
    }
  },

  createArchiveBrowserModel() {
    return ArchiveBrowserModel.create({
      ownerSource: this,
      spaceDatasetsViewState: this,
      getDatasetsUrl: this.getDatasetsUrl.bind(this),
      openCreateArchiveModal: this.openCreateArchiveModal.bind(this),
      openPurgeModal: this.openArchivesPurgeModal.bind(this),
    });
  },

  getDatasetsUrl() {
    throw new Error('getDatasetsUrl not implemented');
  },

  openCreateArchiveModal() {
    throw new Error('openCreateArchiveModal not implemented');
  },

  openArchivesPurgeModal() {
    throw new Error('openPurgeModal not implemented');
  },

  // FIXME: redundancy with content-space-datasets
  async fetchDatasetArchives(datasetId, startIndex, size, offset) {
    const archiveManager = this.get('archiveManager');
    return this.browserizeArchives(await archiveManager.fetchDatasetArchives({
      datasetId,
      index: startIndex,
      limit: size,
      offset,
    }));
  },

  // FIXME: redundancy with content-space-archives
  async browserizeArchives({ childrenRecords, isLast }) {
    const archiveManager = this.get('archiveManager');
    return {
      childrenRecords: await allFulfilled(childrenRecords.map(record =>
        archiveManager.getBrowsableArchive(get(record, 'entityId'))
      )),
      isLast,
    };
  },

  // FIXME: redundancy with content-space-archives
  async resolveItemParent( /* item */ ) {
    const {
      viewMode,
    } = this.getProperties('viewMode');

    if (viewMode === 'files') {
      // FIXME: support for files
      throw new Error('no resolveItemParent files support');
    } else if (viewMode === 'archives') {
      // archive browser: root (there is no archives tree - only flat list starting
      // from root)
      return null;
    }
  },

  actions: {
    resolveItemParent() {
      return this.resolveItemParent(...arguments);
    },
    async fetchChildren() {
      const data = await this.fetchDatasetArchives(...arguments);
      return data;
    },
    changeSelectedItems(selectedItems) {
      return this.changeSelectedItems(selectedItems);
    },
    updateDirEntityId() {

    },
  },
});
