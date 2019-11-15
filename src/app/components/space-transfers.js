/**
 * A view component for onedata.transfers.show route
 *
 * @module components/space-transfers
 * @author Jakub Liput
 * @copyright (C) 2017-2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import _ from 'lodash';
import SpaceTransfersUpdater from 'oneprovider-gui/utils/space-transfers-updater';
import bidirectionalPairs from 'oneprovider-gui/utils/bidirectional-pairs';
import mutateArray from 'onedata-gui-common/utils/mutate-array';
import generateColors from 'onedata-gui-common/utils/generate-colors';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import PromiseObject from 'onedata-gui-common/utils/ember/promise-object';
import ListWatcher from 'onedata-gui-common/utils/list-watcher';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { get, set, computed, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import { and, equal, raw, promise } from 'ember-awesome-macros';
import { A, isArray } from '@ember/array';
import { resolve, all as allFulfilled } from 'rsvp';
import { isEmpty } from '@ember/utils';
import $ from 'jquery';
import { next } from '@ember/runloop';
import { getOwner } from '@ember/application';
import { fileEntityType } from 'oneprovider-gui/models/file';
import gri from 'onedata-gui-websocket-client/utils/gri';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import ReplacingChunksArray from 'onedata-gui-common/utils/replacing-chunks-array';

// FIXME: loading states can be reached using ...IsUpdating in SpaceTransfersUpdater

export default Component.extend(I18n, {
  classNames: ['space-transfers', 'row'],
  store: service(),
  onedataConnection: service(),
  transferManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceTransfers',

  //#region External properties

  /**
   * Space model, which transfers will be listed
   * @virtual
   * @type {Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  changeListTab: notImplementedWarn,

  /**
   * @virtual
   * @type {Function}
   */
  closeFileTab: notImplementedWarn,

  /**
   * @virtual optional
   * If set, skip auto select of first opened tab and use injected tab ID
   * @type {string|null}
   */
  defaultTab: undefined,

  /**
   * An ID of file for which a special transfers tab will be created.
   * If undefined/null the tab will not be created
   * @type {string|undefined}
   */
  fileId: undefined,

  //#endregion

  //#region Internal properties

  listLocked: false,

  activeTabId: reads('initialTabProxy.content'),

  /**
   * Holds tab ID that was opened recently.
   * It should be cleared if some operations after opening has been done.
   * @type {string|null}
   */
  tabJustChangedId: null,

  /**
   * @type {boolean}
   */
  isTransfersTableBegin: false,

  transfersUpdaterEnabled: true,

  /**
   * Updates transfers data needed by most of visible components.
   * Initialized in `init`.
   * @type {SpaceTransfersUpdater}
   */
  transfersUpdater: undefined,

  /**
   * Collection of Transfer model for waiting transfers.
   * Set in `initTransfers`.
   * @type {ComputedProperty<ReplacingChunksArray<Transfer>>}
   */
  waitingTransfersArray: computedSpaceTransfersArray('waiting'),

  /**
   * Collection of Transfer model for ongoing transfers.
   * Set in `initTransfers`.
   * @type {ComputedProperty<ReplacingChunksArray<Transfer>>}
   */
  ongoingTransfersArray: computedSpaceTransfersArray('ongoing'),

  /**
   * Collection of Transfer model for ended transfers.
   * Set in `initTransfers`.
   * @type {ComputedProperty<ReplacingChunksArray<Transfer>>}
   */
  endedTransfersArray: computedSpaceTransfersArray('ended'),

  // FIXME: refactor to fileTransfersArray which is replacing chunks array
  /**
   * Collection of Transfer model for file transfers
   * @type {ComputedProperty<ReplacingChunksArray<Transfer>>}
   */
  fileTransfers: undefined,

  /**
   * If true, this instance of data container already scrolled to selected transfers
   * @type {boolean}
   */
  _scrolledToSelectedTransfers: false,

  /**
   * Cache for `transfersActiveChannels`
   * @type {Ember.Array<ProviderTransferConnection>}
   */
  transfersActiveChannelsCache: undefined,

  /**
   * @type {ListWatcher}
   * Initialized in `didInsertElement`
   */
  listWatcher: undefined,

  _window: window,

  rowHeight: 73,

  destinationProviderIdsCache: computed(() => A()),

  sourceProviderIdsCache: computed(() => A()),

  //#endregion

  //#region Computed properties

  spaceId: reads('space.entityId'),

  providersLoaded: reads('providerList.list.isSettled'),
  providersError: reads('providerList.list.reason'),

  /**
   * @type {ComputedProperty<FakeListRecordRelation|undefined>}
   */
  fileTransferList: reads('file.transferList'),

  providerList: reads('space.providerList'),
  providersMap: reads('space.transfersActiveChannels.channelDestinations'),

  /**
   * @type {ComputedProperty<models.File>}
   */
  file: reads('fileProxy.content'),

  /**
   * Max number of ended transfers that can be fetched for transfer
   * @type {ComputedProperty<number>}
   */
  _historyLimitPerFile: reads(
    'onedataConnection.transfersHistoryLimitPerFile'
  ),

  /**
   * List of providers that support this space
   * @type {ComputedProperty<Ember.Array<Provider>>}
   */
  providers: reads('space.providerList.list.content'),

  generalDataLoaded: and(
    // legacy, probably can be removed in future
    equal('isSupportedByOngoingProvider', raw(true)),
    // needed by overview
    'providersLoaded',
    // ongoing data is needed by overview
    'ongoingTransfersArray.isLoaded',
  ),

  /**
   * A "pointer" to ReplacingChunksArray with transfers for currently opened tab
   * @type {ComputedProperty<ReplacingChunksArray>}
   */
  openedTransfersArray: computed(
    'waitingTransfersArray',
    'ongoingTransfersArray',
    'endedTransfersArray',
    'activeTabId',
    function openedTransfersArray() {
      return this.get(`${this.get('activeTabId')}TransfersArray`);
    }
  ),

  /**
   * Creates an array of provider ids that are destination of transfers for space
   * NOTE: returns new array every recomputation
   * @type {ComputedProperty<Array<string>>}
   */
  destinationProviderIds: computed(
    'providersMap',
    function getDestinationProviderIds() {
      const providersMap = this.get('providersMap');
      if (!isEmpty(providersMap)) {
        return _.uniq(_.flatten(_.values(providersMap)));
      }
    }
  ),

  /**
   * Creates an array of provider ids that are source of transfers for space
   * NOTE: returns new array every recomputation
   * @type {ComputedProperty<Array<string>>}
   */
  sourceProviderIds: computed(
    'providersMap',
    function sourceProviderIds() {
      const providersMap = this.get('providersMap');
      if (!isEmpty(providersMap)) {
        return Object.keys(providersMap);
      }
    }
  ),

  /**
   * Global colors for each provider
   * @type {ComputedProperty<Object>}
   */
  providersColors: computed('providers.@each.entityId', function providersColors() {
    const providers = this.get('providers');
    if (providers) {
      const providerIds = providers.mapBy('entityId').sort();
      const colors = generateColors(providerIds.length + 1);
      return _.assign(
        _.zipObject(providerIds, colors), { unknown: colors[colors.length - 1] }
      );
    }
  }),

  /**
   * @type {ComputedProperty<PromiseObject<string>>}
   */
  initialTabProxy: promise.object(computed(function initialTabProxy() {
    const {
      defaultTab,
      fileId,
    } = this.getProperties('defaultTab', 'fileId');
    const defaultTabDefinedValid = defaultTab && (defaultTab === 'file' &&
      fileId) || ['waiting', 'ongoing', 'complete'].includes(defaultTab);
    if (defaultTabDefinedValid) {
      return resolve(defaultTab);
    } else if (fileId) {
      return resolve('file');
    } else {
      return allFulfilled(
        ['waiting', 'ongoing', 'ended'].map(transferType =>
          this.get(transferType + 'TransfersArray.initialLoad')
        )
      ).then(([waitingArray, ongoingArray, endedArray]) => {
        if (get(waitingArray, 'length') > 0) {
          return 'waiting';
        } else if (get(ongoingArray, 'length') > 0) {
          return 'ongoing';
        } else if (get(endedArray, 'length') > 0) {
          return 'ended';
        } else {
          return 'waiting';
        }
      });
    }
  })),

  /**
   * @type {ComputedProperty<String>}
   */
  providerId: computed(function providerId() {
    const application = getOwner(this).application;
    if (application) {
      return application.guiContext.clusterId;
    }
  }),

  /**
   * A file record for which a special tab will be rendered.
   * If no `fileId` is provided - undefined.
   * If file is broken - rejects.
   * @type {ComputedProperty<PromiseObject<models.File>>|undefined}
   */
  fileProxy: computed(
    'fileId',
    function fileProxy() {
      const {
        store,
        fileId,
      } = this.getProperties('store', 'fileId');
      const fileGri = gri({
        entityType: fileEntityType,
        entityId: fileId,
        scope: 'private',
      });
      if (fileId) {
        const promise = store.findRecord('file', fileGri)
          .then(record => {
            if (get(record, 'type') === 'broken') {
              throw { message: 'not_found' };
            } else {
              return record;
            }
          });
        return PromiseObject.create({ promise });
      }
    }
  ),

  /**
   * Name of icon to use in file tab
   * @type {ComputedProperty<string>}
   */
  _fileTabIcon: computed(
    'file.isDir',
    function _fileTabIcon() {
      return this.get('file.isDir') ? 'folder' : 'file';
    }
  ),

  /**
   * True if transfers can be listed because space is supported by ongoing
   * provider.
   * @type {ComputedProperty<boolean>}
   */
  isSupportedByOngoingProvider: computed(
    'providerId',
    'providers.[]',
    function isSupportedByOngoingProvider() {
      const {
        providers,
        providerId,
      } = this.getProperties('providerId', 'providers');
      if (isArray(providers) && providerId != null) {
        return _.includes(providers.map(p => get(p, 'entityId')), providerId);
      } else {
        return null;
      }
    }
  ),

  /**
   * Number of loaded ended transfers for file tab.
   * @type {ComputedProperty<number>}
   */
  _fileEndedTransfersCount: computed(
    'fileTransfers.sourceArray.@each.finishTime',
    function _fileEndedTransfersCount() {
      const allFileTransfers = this.get('fileTransfers.sourceArray');
      if (allFileTransfers) {
        return allFileTransfers
          .reduce(
            (sum, transfer) => sum + (get(transfer, 'finishTime') ? 1 : 0),
            0
          );
      }
    }
  ),

  /**
   * True if the `_endedTransfersCount` reached history limit
   * @type {boolean}
   */
  _fileHistoryLimitReached: computed(
    'fileTransfersLoadingMore',
    '_historyLimitPerFile',
    '_fileEndedTransfersCount',
    function _fileHistoryLimitReached() {
      if (!this.get('fileTransfersLoadingMore')) {
        const {
          _historyLimitPerFile,
          _fileEndedTransfersCount,
        } = this.getProperties('_historyLimitPerFile', '_fileEndedTransfersCount');
        return _fileEndedTransfersCount >= _historyLimitPerFile;
      }
    }
  ),

  activeListUpdaterId: computed(
    'activeTabId',
    'isTransfersTableBegin',
    function activeListUpdaterId() {
      if (this.get('isTransfersTableBegin')) {
        return this.get('activeTabId');
      }
    }
  ),

  /**
   * Collection of connection between two providers (for map display)
   * Order in connection is random; each pair can occur once.
   * See `util:transfers/bidirectional-pairs`
   * `[['a', 'b'], ['c', 'a'], ['b', 'c']]`
   * @type {ComputedProperty<Array<ProviderTransferConnection|undefined>>}
   */
  transfersActiveChannels: computed(
    'providersMap',
    'transfersActiveChannelsCache',
    function transfersActiveChannels() {
      const {
        providersMap,
        transfersActiveChannelsCache,
      } = this.getProperties('providersMap', 'transfersActiveChannelsCache');
      if (providersMap) {
        mutateArray(
          transfersActiveChannelsCache,
          bidirectionalPairs(providersMap),
          (x, y) => x[0] === y[0] && x[1] === y[1]
        );
      }
      return transfersActiveChannelsCache;
    }
  ),

  //#endregion

  //#region Observers

  /**
   * Watches updater settings dependecies and changes its settings
   */
  configureTransfersUpdater: observer(
    'transfersUpdaterEnabled',
    'space',
    function configureTransfersUpdater() {
      const {
        transfersUpdaterEnabled,
        space,
      } = this.getProperties(
        'transfersUpdaterEnabled',
        'space'
      );
      this.get('transfersUpdater').setProperties({
        isEnabled: transfersUpdaterEnabled,
        space: space,
      });
    }
  ),

  tabChanged: observer('activeTabId', function observeTabChanged() {
    const {
      activeTabId,
      changeListTab,
    } = this.getProperties('activeTabId', 'changeListTab');
    changeListTab(activeTabId);
    this.set('tabJustChangedId', activeTabId);
  }),

  // FIXME: refactor? this observer is configuring watcher, so maybe it should be
  // merged with configureTransfersUpdater
  enableWatcherCollection: observer(
    'activeListUpdaterId',
    'activeTabId',
    'file',
    'fileProxy.isFulfilled',
    function enableWatcherCollection() {
      const {
        activeListUpdaterId,
        activeTabId,
        transfersUpdater,
        file,
        fileProxy,
      } = this.getProperties(
        'activeListUpdaterId',
        'transfersUpdater',
        'activeTabId',
        'file',
        'fileProxy'
      );
      transfersUpdater.setProperties({
        waitingEnabled: activeListUpdaterId === 'waiting',
        ongoingEnabled: activeListUpdaterId === 'ongoing',
        transferProgressEnabled: _.includes(
          ['waiting', 'ongoing', 'file'],
          activeTabId
        ),
        endedEnabled: activeListUpdaterId === 'ended',
        fileEnabled: (
          activeTabId === 'file' &&
          fileProxy &&
          get(fileProxy, 'isFulfilled')
        ),
        file,
      });
    }),

  // FIXME: computed instead of observer/init
  // fileChanged: observer('fileProxy.content', function fileChanged() {
  //   if (this.get('file')) {
  //     this.initTransfers('file');
  //   }
  // }),

  spaceChanged: observer('space', function spaceChanged() {
    this._spaceChanged();
  }),

  //#endregion

  //#region Core methods

  init() {
    this._super(...arguments);
    this._spaceChanged(true);
    this.initTransfersUpdater();
    // FIXME: method will be probably removed
    // this.fileChanged();
    // FIXME: debug
    window.spaceTransfers = this;
  },

  didInsertElement() {
    this.set('listWatcher', this.createListWatcher());
  },

  willDestroyElement() {
    try {
      const {
        listWatcher,
        transfersUpdater,
      } = this.getProperties('listWatcher', 'transfersUpdater');
      if (listWatcher) {
        listWatcher.destroy();
      }
      if (transfersUpdater) {
        transfersUpdater.destroy();
      }
    } finally {
      this._super(...arguments);
    }
  },

  //#endregion

  //#region Methods

  createListWatcher() {
    // FIXME: use top selector?
    return new ListWatcher(
      $('#content-scroll'),
      '.data-row',
      items => safeExec(this, 'onTableScroll', items)
    );
  },

  initTransfersUpdater() {
    const {
      transfersUpdaterEnabled,
      space,
      store,
      transfersUpdater: oldTransfersUpdater,
      activeListUpdaterId,
      activeTabId,
      fileProxy,
      file,
      waitingTransfersArray,
      ongoingTransfersArray,
      endedTransfersArray,
    } = this.getProperties(
      'transfersUpdaterEnabled',
      'space',
      'store',
      'activeTabId',
      'activeListUpdaterId',
      'transfersUpdater',
      'fileProxy',
      'file',
      'waitingTransfersArray',
      'ongoingTransfersArray',
      'endedTransfersArray',
    );

    if (oldTransfersUpdater) {
      oldTransfersUpdater.destroy();
    }
    const transfersUpdater = SpaceTransfersUpdater.create({
      store,
      space,
      file,
      waitingTransfersArray,
      ongoingTransfersArray,
      endedTransfersArray,
      isEnabled: transfersUpdaterEnabled,
      waitingEnabled: activeListUpdaterId === 'waiting',
      ongoingEnabled: activeListUpdaterId === 'ongoing',
      transferProgressEnabled: (
        activeTabId === 'waiting' ||
        activeTabId === 'ongoing'
      ),
      endedEnabled: activeListUpdaterId === 'ended',
      fileEnabled: (
        activeTabId === 'file' &&
        fileProxy &&
        get(fileProxy, 'isFulfilled')
      ),
    });

    this.setProperties({
      transfersActiveChannelsCache: A(),
      transfersUpdater,
    });

    return transfersUpdater;
  },

  _spaceChanged(isInit = false) {
    if (!isInit) {
      // file tab should not be persisted, because it is probably from other space
      this._clearFileId();
    }
  },

  _clearFileId() {
    return this.get('closeFileTab')();
  },

  // FIXME: maybe to refactor this, detach fake transfers lists from
  // space record and make only lists here
  // FIXME: removed this.get('transfersUpdater').fetchSpecificRecords(visibleIds);
  // after computing replacing chunks array

  // FIXME: compare with new version of onTableScroll from file browser
  /**
   * @param {Array<HTMLElement>} items 
   */
  onTableScroll(items) {
    const {
      openedTransfersArray,
      transfersUpdater,
      listLocked,
      listWatcher,
    } = this.getProperties(
      'openedTransfersArray',
      'transfersUpdater',
      'listLocked',
      'listWatcher',
    );
    if (!listLocked) {
      if (!openedTransfersArray) {
        return;
      }
      if (items[0] && !items[0].getAttribute('data-row-id')) {
        next(() => {
          openedTransfersArray.fetchPrev().then(() =>
            listWatcher.scrollHandler()
          );
        });
      }
      const sourceArray = get(openedTransfersArray, 'sourceArray');
      const transfersArrayIds = sourceArray.mapBy('entityId');
      const firstNonEmptyRow = items.find(elem => elem.getAttribute('data-row-id'));
      const firstId =
        firstNonEmptyRow && firstNonEmptyRow.getAttribute('data-row-id') || null;
      const lastId = items[items.length - 1] &&
        items[items.length - 1].getAttribute('data-row-id') || null;

      let startIndex, endIndex;
      if (firstId === null && get(sourceArray, 'length') !== 0) {
        const {
          _window,
          rowHeight,
        } = this.getProperties('_window', 'rowHeight');
        const $firstRow = $('.first-row');
        const firstRowTop = $firstRow.offset().top;
        const blankStart = firstRowTop * -1;
        const blankEnd = blankStart + _window.innerHeight;
        startIndex = firstRowTop < 0 ? Math.floor(blankStart / rowHeight) : 0;
        endIndex = Math.max(Math.floor(blankEnd / rowHeight), 0);
      } else {
        startIndex = transfersArrayIds.indexOf(firstId);
        endIndex = transfersArrayIds.indexOf(lastId, startIndex);
      }

      // FIXME: debug log
      console.log('startIndex endIndex', startIndex, endIndex);
      const oldVisibleIds = openedTransfersArray.mapBy('entityId');
      openedTransfersArray.setProperties({ startIndex, endIndex });
      const newVisibleIds = openedTransfersArray.mapBy('entityId');
      set(transfersUpdater, 'visibleIds', newVisibleIds);

      transfersUpdater.fetchSpecificRecords(_.difference(newVisibleIds,
        oldVisibleIds));

      next(() => {
        if (startIndex > 0 && get(openedTransfersArray, 'firstObject.id') ===
          firstId) {
          listWatcher.scrollHandler();
        } else {
          this.set('isTransfersTableBegin', startIndex <= 0);
        }
      });

      // FIXME: rewrite
      // const isLoadingMore = (
      //   get(openedTransfersArray, 'lastObject') !==
      //   get(openedTransfersArray, 'sourceArray.lastObject')
      // );
      // this.set(`${activeTabId}TransfersLoadingMore`, isLoadingMore);
    } else {
      set(transfersUpdater, 'visibleIds', []);
    }
  },

  //#endregion

  actions: {
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

    transferListChanged( /* type */ ) {
      const listWatcher = this.get('listWatcher');
      if (listWatcher) {
        listWatcher.scrollHandler();
      }
    },
    clearJustChangedTabId(type) {
      if (this.get('tabJustChangedId') === type) {
        this.set('tabJustChangedId', null);
      }
    },
    closeFileTab() {
      this.set('activeTabId', 'waiting');
      this._clearFileId();
    },
  },
});

function computedSpaceTransfersArray(type) {
  return computed('space', function () {
    const {
      transferManager,
      space,
    } = this.getProperties('transferManager', 'space');
    // FIXME: debug
    return ReplacingChunksArray.create({
      fetch: (...args) => transferManager.getTransfersForSpace(
        space,
        type,
        ...args,
      ),
      startIndex: 0,
      endIndex: 50,
      indexMargin: 10,
    });
  });
}
