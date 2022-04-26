import Component from '@ember/component';
import { get, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import ReplacingChunksArray from 'onedata-gui-common/utils/replacing-chunks-array';
import { not } from 'ember-awesome-macros';
import InfiniteScrollScrollHandler from 'oneprovider-gui/utils/infinite-scroll/scroll-handler';
import InfiniteScrollFetchingStatus from 'oneprovider-gui/utils/infinite-scroll/fetching-status';
import InfiniteScrollFirstRow from 'oneprovider-gui/utils/infinite-scroll/first-row';
import InfiniteScrollListUpdater from 'oneprovider-gui/utils/infinite-scroll/list-updater';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

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

  columnsCount: 2,

  //#endregion

  //#region state

  /**
   * @type {InfiniteScrollListFetchingStatus}
   */
  fetchingStatus: undefined,

  /**
   * @type {InfiniteScrollListFirstRow}
   */
  firstRow: undefined,

  /**
   * @type {InfiniteScrollScrollHandler}
   */
  scrollHandler: undefined,

  /**
   * @type {Looper}
   */
  listUpdater: undefined,

  //#endregion

  recallRootFileId: reads('recallRootFile.entityId'),

  archiveId: reads('archive.entityId'),

  datasetId: reads('dataset.entityId'),

  /**
   * @type {ComputedProperty<ReplacingChunksArray<JsonInfiniteLogEntry<RecallLogEvent>>>}
   */
  entries: computed(function entries() {
    const rca = ReplacingChunksArray.create({
      fetch: this.fetchEntries.bind(this),
      startIndex: 0,
      endIndex: 50,
      indexMargin: 10,
    });
    this.initFetchingStatus(rca);
    this.initListUpdater(rca);
    return rca;
  }),

  noEntries: not('entries.length'),

  init() {
    this._super(...arguments);
    const entries = this.get('entries');
    this.set('firstRow', InfiniteScrollFirstRow.create({
      // changes should be synchronized with .table-data-cell-content height in styles
      singleRowHeight: 44,
      entries,
    }));
  },

  /**
   * @override
   */
  didInsertElement() {
    this._super(...arguments);
    this.initScrollHandler();
  },

  /**
   * @override
   */
  willDestroyElement() {
    const {
      scrollHandler,
      listUpdater,
    } = this.getProperties('scrollHandler', 'listUpdater');
    try {
      if (scrollHandler) {
        scrollHandler.destroy();
      }
      if (listUpdater) {
        listUpdater.destroy();
      }
    } finally {
      this._super(...arguments);
    }
  },

  handleTableScroll({ headerVisible }) {
    const listUpdater = this.get('listUpdater');
    if (!listUpdater) {
      return;
    }
    if (headerVisible && !get(listUpdater, 'isActive')) {
      listUpdater.start(true);
    } else if (!headerVisible && get(listUpdater, 'isActive')) {
      listUpdater.stop();
    }
  },

  /**
   * @returns {Promise<Array<JsonInfiniteLogEntry<RecallLogEntry>>>}
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

  initFetchingStatus(replacingChunksArray) {
    this.set('fetchingStatus', InfiniteScrollFetchingStatus.create({
      replacingChunksArray,
    }));
  },

  initScrollHandler() {
    const {
      element,
      entries,
      firstRow,
    } = this.getProperties(
      'element',
      'entries',
      'firstRow',
    );
    this.set('scrollHandler', InfiniteScrollScrollHandler.create({
      element,
      entries,
      firstRow,
      onScroll: this.handleTableScroll.bind(this),
    }));
  },

  initListUpdater(entries) {
    const listUpdater = this.set('listUpdater', InfiniteScrollListUpdater.create({
      entries,
    }));
    listUpdater.start();
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
