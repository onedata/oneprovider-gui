/**
 * Container for transfers table providing infinite scroll and auto-update support
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import Looper from 'onedata-gui-common/utils/looper';
import { get } from '@ember/object';
import { reads } from '@ember/object/computed';
import ReplacingChunksArray from 'onedata-gui-common/utils/replacing-chunks-array';
import { inject as service } from '@ember/service';
import { resolve, all as allFulfilled } from 'rsvp';
import ListWatcher from 'onedata-gui-common/utils/list-watcher';
import $ from 'jquery';
import { next } from '@ember/runloop';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { isEmpty } from '@ember/utils';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import transferIndex from 'oneprovider-gui/utils/transfer-index';
import dom from 'onedata-gui-common/utils/dom';
import globals from 'onedata-gui-common/utils/globals';
import {
  destroyDestroyableComputedValues,
  destroyableComputed,
  initDestroyableCache,
} from 'onedata-gui-common/utils/destroyable-computed';

const updateInterval = 5000;

const endedStates = new Set(['completed', 'skipped', 'cancelled', 'failed']);

export default Component.extend({
  classNames: ['transfers-table-container'],

  transferManager: service(),

  /**
   * @virtual
   * @type {String}
   */
  type: undefined,

  /**
   * @virtual
   * @type {Array<Models.Provider>}
   */
  providers: undefined,

  /**
   * @virtual
   * @type {Object}
   */
  providersColors: undefined,

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  openDbViewModal: notImplementedThrow,

  /**
   * @virtual
   * @type {Object}
   */
  forbiddenOperations: Object.freeze({}),

  historyLimitReached: false,

  tableTopVisible: true,

  rowHeight: 73,

  spaceId: reads('space.entityId'),

  // TODO: VFS-8809 migrate to InfiniteScroll toolkit
  transfersArray: destroyableComputed('type', function transfersArray() {
    const type = this.get('type');
    return ReplacingChunksArray.create({
      fetch: this.fetchTransfers.bind(this),
      getIndex(record) {
        return transferIndex(record, type);
      },
      startIndex: 0,
      endIndex: 50,
      indexMargin: 10,
    });
  }),

  init() {
    initDestroyableCache(this);
    this._super(...arguments);
    const updater = Looper.create({
      immediate: false,
      interval: updateInterval,
    });
    updater.on('tick', this.updateTransfersArray.bind(this));
    this.set('updater', updater);
  },

  /**
   * @override
   */
  didInsertElement() {
    this._super(...arguments);
    this.set('listWatcher', this.createListWatcher());
    this.get('transfersArray.initialLoad').then(() => {
      next(() => {
        this.get('listWatcher').scrollHandler();
      });
    });
  },

  /**
   * @override
   */
  willDestroy() {
    try {
      destroyDestroyableComputedValues(this);
    } finally {
      this._super(...arguments);
    }
  },

  /**
   * @override
   */
  willDestroyElement() {
    try {
      this.listWatcher?.destroy();
      this.updater?.destroy();
    } finally {
      this._super(...arguments);
    }
  },

  fetchTransfers() {
    const {
      transferManager,
      space,
      type,
    } = this.getProperties('transferManager', 'space', 'type');
    return transferManager.getTransfersForSpace(
      space,
      type,
      ...arguments,
    );
  },

  createListWatcher() {
    return new ListWatcher(
      $('#content-scroll'),
      '.data-row',
      (items, headerVisible) => safeExec(this, 'onTableScroll', items, headerVisible),
      '.transfers-table-thead'
    );
  },

  /**
   * @param {Array<HTMLElement>} items
   * @param {boolean} headerVisible
   */
  onTableScroll(items, headerVisible) {
    const {
      transfersArray,
      listWatcher,
    } = this.getProperties(
      'transfersArray',
      'listWatcher',
    );
    const sourceArray = get(transfersArray, 'sourceArray');

    if (isEmpty(items) && !isEmpty(sourceArray)) {
      transfersArray.setProperties({ startIndex: 0, endIndex: 50 });
      safeExec(this, 'set', 'tableTopVisible', headerVisible);
      return;
    }

    const transfersArrayIds = sourceArray.mapBy('entityId');
    const firstNonEmptyRow = items.find(elem => elem.getAttribute('data-row-id'));
    const firstId =
      firstNonEmptyRow && firstNonEmptyRow.getAttribute('data-row-id') || null;
    const lastId = items[items.length - 1] &&
      items[items.length - 1].getAttribute('data-row-id') || null;

    let startIndex;
    let endIndex;
    if (firstId === null && get(sourceArray, 'length') !== 0) {
      const firstRow = this.element?.querySelector('.first-row');
      const firstRowTop = firstRow ? dom.offset(firstRow).top : 0;
      const blankStart = firstRowTop * -1;
      const blankEnd = blankStart + globals.window.innerHeight;
      startIndex = firstRowTop < 0 ? Math.floor(blankStart / this.rowHeight) : 0;
      endIndex = Math.max(Math.floor(blankEnd / this.rowHeight), 0);
    } else {
      startIndex = transfersArrayIds.indexOf(firstId);
      endIndex = transfersArrayIds.indexOf(lastId, startIndex);
    }

    transfersArray.setProperties({ startIndex, endIndex });

    next(() => {
      const isBackwardLoading = startIndex > 0 &&
        get(transfersArray, 'firstObject.id') === firstId;
      if (isBackwardLoading) {
        listWatcher.scrollHandler();
      }
      safeExec(this, () => {
        this.set('tableTopVisible', headerVisible && !isBackwardLoading);
      });
    });
  },

  updateTransfersArray() {
    const {
      tableTopVisible,
      transfersArray,
    } = this.getProperties('tableTopVisible', 'transfersArray');
    const listReload = tableTopVisible ?
      transfersArray.scheduleReload() :
      resolve(transfersArray);

    return listReload
      .then(transfersArray => {
        return allFulfilled(
          transfersArray
          .filter(transfer => {
            return get(transfer, 'state') !== 'ended' ||
              !endedStates.has(get(transfer, 'transferProgress.status'));
          })
          .map(transfer => transfer.updateTransferProgressProxy({ replace: true }))
        );
      });
  },

  actions: {
    clearJustChangedTabId() {
      return this.get('clearJustChangedTabId')(...arguments);
    },

    /**
     * Start transfer cancel procedure
     * @param {string} transferId
     * @returns {Promise<undefined|any>}
     */
    cancelTransfer(transferId) {
      return this.get('transferManager').cancelTransfer(transferId);
    },

    /**
     * Rerun transfer procedure
     * @param {string} transferId
     * @returns {Promise<undefined|any>}
     */
    rerunTransfer(transferId) {
      return this.get('transferManager').rerunTransfer(transferId);
    },

    openDbViewModal() {
      return this.get('openDbViewModal')(...arguments);
    },
  },
});
