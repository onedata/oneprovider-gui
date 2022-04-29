/**
 * Infinite scroll table with events (currently only errors) of recall process.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import ReplacingChunksArray from 'onedata-gui-common/utils/replacing-chunks-array';
import { not } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import InfiniteScroll from 'oneprovider-gui/utils/infinite-scroll';

export default Component.extend(I18n, {
  classNames: ['file-recall-event-log'],

  fileManager: service(),
  appProxy: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileRecall.eventLog',

  /**
   * @virtual
   * @type {Models.File}
   */
  recallRootFile: undefined,

  /**
   * @virtual
   * @type {Models.Archive}
   */
  archive: undefined,

  /**
   * @virtual
   * @type {Models.Dataset}
   */
  dataset: undefined,

  //#region configuration

  columnsCount: 3,

  //#endregion

  //#region state

  /**
   * @type {Utils.InfiniteScroll}
   */
  infiniteScroll: undefined,

  //#endregion

  recallRootFileId: reads('recallRootFile.entityId'),

  archiveId: reads('archive.entityId'),

  datasetId: reads('dataset.entityId'),

  /**
   * @type {ComputedProperty<ReplacingChunksArray<RecallLogEntry>>}
   */
  entries: computed(function entries() {
    return ReplacingChunksArray.create({
      fetch: this.fetchEntries.bind(this),
      startIndex: 0,
      endIndex: 50,
      indexMargin: 10,
    });
  }),

  noEntries: not('entries.length'),

  init() {
    this._super(...arguments);
    const entries = this.get('entries');
    const infiniteScroll = this.set('infiniteScroll', InfiniteScroll.create({
      entries,
      // changes should be synchronized with .table-data-cell-content height in styles
      singleRowHeight: 44,
      onScroll: this.handleTableScroll.bind(this),
    }));
    infiniteScroll.startAutoUpdate();
  },

  /**
   * @override
   */
  didInsertElement() {
    this._super(...arguments);
    const {
      infiniteScroll,
      element,
    } = this.getProperties(
      'infiniteScroll',
      'element',
    );
    infiniteScroll.mount(element);
  },

  /**
   * @override
   */
  willDestroyElement() {
    try {
      this.get('infiniteScroll').destroy();
    } finally {
      this._super(...arguments);
    }
  },

  handleTableScroll({ headerVisible }) {
    const {
      infiniteScroll,
      headerVisible: currentHeaderVisible,
    } = this.getProperties('infiniteScroll', 'headerVisible');
    if (!infiniteScroll) {
      return;
    }
    if (headerVisible !== currentHeaderVisible) {
      this.set('headerVisible', headerVisible);
    }
    if (headerVisible && !get(infiniteScroll, 'isAutoUpdating')) {
      infiniteScroll.startAutoUpdate(true);
    } else if (!headerVisible && get(infiniteScroll, 'isAutoUpdating')) {
      infiniteScroll.stopAutoUpdate();
    }
  },

  /**
   * @returns {Promise<Array<JsonInfiniteLogEntry<RecallLogData>>>}
   */
  async fetchEntries(index, limit, offset) {
    const {
      recallRootFileId,
      fileManager,
    } = this.getProperties('recallRootFileId', 'fileManager');
    const result = await fileManager.getRecallLogs(
      recallRootFileId, {
        index,
        limit,
        offset,
      }
    );
    const entries = result && result.array;
    // Infinite log entries don't have id, which are required by replacing chunks array.
    // Solution: using entry index as id.
    if (entries) {
      entries.forEach(entry => entry.id = entry.index);
    }

    return result;
  },

  /**
   * @param {string} fileId ID of file in archive
   * @returns {string} URL of file in archive
   */
  generateSourceFileUrl(fileId) {
    const {
      appProxy,
      archiveId,
      datasetId,
    } = this.getProperties('appProxy', 'archiveId', 'datasetId');
    if (!archiveId || !datasetId) {
      return null;
    }
    return appProxy.callParent('getDatasetsUrl', {
      selectedDatasets: [datasetId],
      archive: archiveId,
      selectedFiles: [fileId],
    });
  },

  actions: {
    generateSourceFileUrl(fileId) {
      return this.generateSourceFileUrl(fileId);
    },
  },
});
