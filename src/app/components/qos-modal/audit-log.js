/**
 * Infinite scroll table with events for single QoS requirement.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import ReplacingChunksArray from 'onedata-gui-common/utils/replacing-chunks-array';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import InfiniteScroll from 'onedata-gui-common/utils/infinite-scroll';
import { conditional, equal, raw, not } from 'ember-awesome-macros';

export default Component.extend(I18n, {
  classNames: ['qos-audit-log'],

  appProxy: service(),
  qosManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.qosModal.auditLog',

  /**
   * @virtual
   * @type {string}
   */
  qosRequirementId: undefined,

  /**
   * @virtual
   * @type {'file'|'dir'}
   */
  fileType: undefined,

  //#region configuration

  columnsCount: conditional(
    'showFileColumn',
    raw(3),
    raw(2)
  ),

  showFileColumn: equal('fileType', raw('dir')),

  //#endregion

  //#region state

  /**
   * @type {Utils.InfiniteScroll}
   */
  infiniteScroll: undefined,

  //#endregion

  firstRowModel: reads('infiniteScroll.firstRowModel'),

  entries: computed(function entries() {
    return ReplacingChunksArray.create({
      fetch: this.fetchEntries.bind(this),
      startIndex: 0,
      endIndex: 50,
      indexMargin: 10,
    });
  }),

  fileUrlGenerator: computed(function fileUrlGenerator() {
    return new FileUrlGenerator(this.get('appProxy'));
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
      qosRequirementId,
      qosManager,
    } = this.getProperties('qosRequirementId', 'qosManager');
    const result = await qosManager.getAuditLog(
      qosRequirementId, {
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

  actions: {
    /**
     * @param {string} fileId ID of file in archive
     * @returns {string} URL of file in archive
     */
    generateFileUrl(fileId) {
      return this.get('fileUrlGenerator').getUrl(fileId);
    },
  },
});

class FileUrlGenerator {
  constructor(appProxy) {
    this.appProxy = appProxy;
    this.clearCache();
  }
  getUrl(fileId) {
    const cachedUrl = this.cache[fileId];
    if (cachedUrl) {
      return cachedUrl;
    } else {
      this.cache[fileId] = this.generateNewUrl(fileId);
      return this.cache[fileId];
    }
  }
  generateNewUrl(fileId) {
    if (!fileId) {
      return null;
    }
    return this.appProxy.callParent('getDataUrl', {
      selected: [fileId],
    });
  }
  clearCache() {
    this.cache = {};
  }
}
