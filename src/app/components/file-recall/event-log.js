import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import ReplacingChunksArray from 'onedata-gui-common/utils/replacing-chunks-array';
import { not } from 'ember-awesome-macros';
import InfiniteScrollScrollHandler from 'oneprovider-gui/utils/infinite-scroll/scroll-handler';
import InfiniteScrollFetchingStatus from 'oneprovider-gui/utils/infinite-scroll/fetching-status';
import InfiniteScrollFirstRow from 'oneprovider-gui/utils/infinite-scroll/first-row';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  classNames: ['file-recall-event-log'],

  fileManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileRecall.eventLog',

  /**
   * @virtual
   * @type {Models.File}
   */
  recallRootFile: undefined,

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

  //#endregion

  recallRootFileId: reads('recallRootFile.entityId'),

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
    return rca;
  }),

  noEntries: not('entries.length'),

  init() {
    this._super(...arguments);
    const entries = this.get('entries');
    this.set('firstRow', InfiniteScrollFirstRow.create({
      entries,
      // FIXME: for debugging
      singleRowHeight: 40,
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
    try {
      const scrollHandler = this.get('scrollHandler');
      if (scrollHandler) {
        scrollHandler.destroy();
      }
    } finally {
      this._super(...arguments);
    }
  },

  handleScrollTop() {
    // FIXME: update
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

  // FIXME: debug code
  // async fetchEntries() {
  //   const recallRootFileId = this.get('recallRootFileId');
  //   const result = {
  //     array: [{
  //         index: 'a1',
  //         timestamp: 100000000,
  //         content: {
  //           fileId: recallRootFileId,
  //           reason: { id: 'posix', details: { errno: 'enospc' } },
  //         },
  //       },
  //       {
  //         index: 'a2',
  //         timestamp: 230000000,
  //         content: {
  //           fileId: recallRootFileId,
  //           reason: { id: 'posix', details: { errno: 'enospc' } },
  //         },
  //       },
  //     ],
  //     isLast: true,
  //   };
  //   const entries = result && result.array;
  //   // Infinite log entries don't have id, which are required by replacing chunks array.
  //   // Solution: using entry index as id.
  //   if (entries) {
  //     entries.forEach(entry => entry.id = entry.index);
  //   }

  //   return result;
  // },

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
      onScrolledTop: this.handleScrollTop.bind(this),
    }));
  },
});
