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
import providerTransferConnections from 'oneprovider-gui/utils/provider-transfer-connections';
import mutateArray from 'onedata-gui-common/utils/mutate-array';
import generateColors from 'onedata-gui-common/utils/generate-colors';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import PromiseObject from 'onedata-gui-common/utils/ember/promise-object';
import ListWatcher from 'onedata-gui-common/utils/list-watcher';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { get, set, computed, observer } from '@ember/object';
import { reads, readOnly } from '@ember/object/computed';
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

export default Component.extend(I18n, {
  classNames: ['space-transfers', 'row'],
  store: service(),
  onedataConnection: service(),

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
  _tabJustChangedId: null,

  /**
   * @type {boolean}
   */
  _isTransfersTableBegin: undefined,

  transfersUpdaterEnabled: true,

  // FIXME: these loading more properties are never set
  scheduledTransfersLoadingMore: false,
  currentTransfersLoadingMore: false,
  completedTransfersLoadingMore: false,
  fileTransfersLoadingMore: false,

  /**
   * Updates transfers data needed by most of visible components.
   * Initialized in `init`.
   * @type {SpaceTransfersUpdater}
   */
  transfersUpdater: undefined,

  /**
   * Collection of Transfer model for scheduled transfers.
   * Set in `initTransfers`.
   * @type {Ember.ComputedProperty<ReplacingChunksArray<Transfer>>}
   */
  scheduledTransfers: undefined,

  /**
   * Collection of Transfer model for current transfers.
   * Set in `initTransfers`.
   * @type {Ember.ComputedProperty<ReplacingChunksArray<Transfer>>}
   */
  currentTransfers: undefined,

  /**
   * Collection of Transfer model for completed transfers.
   * Set in `initTransfers`.
   * @type {Ember.ComputedProperty<ReplacingChunksArray<Transfer>>}
   */
  completedTransfers: undefined,

  /**
   * Collection of Transfer model for file transfers
   * @type {Ember.ComputedProperty<ReplacingChunksArray<Transfer>>}
   */
  fileTransfers: undefined,

  /**
   * If true, this instance of data container already scrolled to selected transfers
   * @type {boolean}
   */
  _scrolledToSelectedTransfers: false,

  /**
   * Cache for `providerTransferConnections`
   * @type {Ember.Array<ProviderTransferConnection>}
   */
  _ptcCache: undefined,

  /**
   * @type {ListWatcher}
   * Initialized in `didInsertElement`
   */
  listWatcher: undefined,

  //#endregion

  //#region Computed properties

  _transfersUpdaterEnabled: readOnly('transfersUpdaterEnabled'),

  providersLoaded: reads('providerList.list.isSettled'),
  providersError: reads('providerList.list.reason'),

  scheduledTransfersLoaded: reads('scheduledTransferList.isLoaded'),
  currentTransfersLoaded: reads('currentTransferList.isLoaded'),
  completedTransfersLoaded: reads('completedTransferList.isLoaded'),

  scheduledTransferList: reads('space.scheduledTransferList'),
  currentTransferList: reads('space.currentTransferList'),
  completedTransferList: reads('space.completedTransferList'),

  /**
   * @type {Ember.ComputedProperty<FakeListRecordRelation|undefined>}
   */
  fileTransferList: reads('file.transferList'),

  providerList: reads('space.providerList'),
  providersMap: reads('space.transfersActiveChannels.channelDestinations'),

  /**
   * @type {Ember.ComputedProperty<models.File>}
   */
  file: reads('fileProxy.content'),

  /**
   * Max number of ended transfers that can be fetched for transfer
   * @type {Ember.ComputedProperty<number>}
   */
  _historyLimitPerFile: reads(
    'onedataConnection.transfersHistoryLimitPerFile'
  ),

  /**
   * List of providers that support this space
   * @type {Ember.ComputedProperty<Ember.Array<Provider>>}
   */
  providers: reads('space.providerList.list.content'),

  generalDataLoaded: and(
    equal('isSupportedByCurrentProvider', raw(true)),
    'providersLoaded',
    'currentTransfersLoaded',
  ),

  /**
   * A "pointer" to ReplacingChunksArray with transfers for currently opened tab
   * @type {ComputedProperty<ReplacingChunksArray>}
   */
  openedTransfersChunksArray: computed(
    'scheduledTransfers',
    'currentTransfers',
    'completedTransfers',
    'activeTabId',
    function openedTransfersChunksArray() {
      return this.get(`${this.get('activeTabId')}Transfers`);
    }
  ),

  /**
   * Creates an array of provider ids that are destination of transfers for space
   * NOTE: returns new array every recomputation
   * @type {Ember.ComputedProperty<Array<string>>}
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
   * @type {Ember.ComputedProperty<Array<string>>}
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
   * @type {Ember.ComputedProperty<Object>}
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
   * @type {Ember.ComputedProperty<PromiseObject<string>>}
   */
  initialTabProxy: promise.object(computed(function initialTabProxy() {
    const {
      defaultTab,
      fileId,
    } = this.getProperties('defaultTab', 'fileId');
    const defaultTabDefinedValid = defaultTab && (defaultTab === 'file' &&
      fileId) || ['scheduled', 'current', 'complete'].includes(defaultTab);
    if (defaultTabDefinedValid) {
      return resolve(defaultTab);
    } else if (fileId) {
      return resolve('file');
    } else {
      return allFulfilled(
        ['scheduled', 'current', 'completed'].map(transferType =>
          this.get(transferType + 'TransferList')
        )
      ).then(([scheduledList, currentList, completedList]) => {
        if (get(scheduledList, 'length') > 0) {
          return 'scheduled';
        } else if (get(currentList, 'length') > 0) {
          return 'current';
        } else if (get(completedList, 'length') > 0) {
          return 'completed';
        } else {
          return 'scheduled';
        }
      });
    }
  })),

  /**
   * @type {ComputedProperty<String>}
   */
  providerId: computed(function providerId() {
    return getOwner(this).application.guiContext.clusterId;
  }),

  /**
   * A file record for which a special tab will be rendered.
   * If no `fileId` is provided - undefined.
   * If file is broken - rejects.
   * @type {Ember.ComputedProperty<PromiseObject<models.File>>|undefined}
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
   * @type {Ember.ComputedProperty<string>}
   */
  _fileTabIcon: computed(
    'file.isDir',
    function _fileTabIcon() {
      return this.get('file.isDir') ? 'folder' : 'file';
    }
  ),

  /**
   * True if transfers can be listed because space is supported by current
   * provider.
   * @type {Ember.ComputedProperty<boolean>}
   */
  isSupportedByCurrentProvider: computed(
    'providerId',
    'providers.[]',
    function isSupportedByCurrentProvider() {
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
   * @type {Ember.ComputedProperty<number>}
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

  // FIXME: maybe the table should be updated no matter where we are
  activeListUpdaterId: computed(
    'activeTabId',
    '_isTransfersTableBegin',
    function activeListUpdaterId() {
      if (this.get('_isTransfersTableBegin')) {
        return this.get('activeTabId');
      }
    }
  ),

  /**
   * Collection of connection between two providers (for map display)
   * Order in connection is random; each pair can occur once.
   * See `util:transfers/provider-transfer-connections`
   * `[['a', 'b'], ['c', 'a'], ['b', 'c']]`
   * @type {Ember.ComputedProperty<Array<ProviderTransferConnection|undefined>>}
   */
  providerTransferConnections: computed(
    'providersMap',
    '_ptcCache',
    function _providerTransferConnections() {
      const {
        providersMap,
        _ptcCache,
      } = this.getProperties('providersMap', '_ptcCache');
      if (providersMap) {
        mutateArray(
          _ptcCache,
          providerTransferConnections(providersMap),
          (x, y) => x[0] === y[0] && x[1] === y[1]
        );
      }
      return _ptcCache;
    }
  ),

  //#endregion

  //#region Observers

  /**
   * Watches updater settings dependecies and changes its settings
   */
  configureTransfersUpdater: observer(
    '_transfersUpdaterEnabled',
    'space',
    function configureTransfersUpdater() {
      const {
        _transfersUpdaterEnabled,
        space,
      } = this.getProperties(
        '_transfersUpdaterEnabled',
        'space'
      );
      this.get('transfersUpdater').setProperties({
        isEnabled: _transfersUpdaterEnabled,
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
    this.set('_tabJustChangedId', activeTabId);
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
        scheduledEnabled: activeListUpdaterId === 'scheduled',
        currentEnabled: activeListUpdaterId === 'current',
        transferProgressEnabled: _.includes(
          ['scheduled', 'current', 'file'],
          activeTabId
        ),
        completedEnabled: activeListUpdaterId === 'completed',
        fileEnabled: (
          activeTabId === 'file' &&
          fileProxy &&
          get(fileProxy, 'isFulfilled')
        ),
        file,
      });
    }),

  fileChanged: observer('fileProxy.content', function fileChanged() {
    if (this.get('file')) {
      this.initTransfers('file');
    }
  }),

  spaceChanged: observer('space', function spaceChanged() {
    this._spaceChanged();
  }),

  //#endregion

  //#region Core methods

  init() {
    this._super(...arguments);
    this._spaceChanged(true);
    this.fileChanged();
  },

  didInsertElement() {
    const listWatcher = new ListWatcher(
      $('#content-scroll'),
      '.transfer-row',
      items => safeExec(this, 'onTableScroll', items)
    );
    this.set('listWatcher', listWatcher);
  },

  willDestroyElement() {
    try {
      const {
        listWatcher,
        transfersUpdater,
      } = this.getProperties('listWatcher', 'transfersUpdater');
      listWatcher.destroy();
      transfersUpdater.destroy();
    } finally {
      this._super(...arguments);
    }
  },

  //#endregion

  //#region Methods

  initTransfersUpdater() {
    const {
      _transfersUpdaterEnabled,
      space,
      store,
      transfersUpdater: oldTransfersUpdater,
      activeListUpdaterId,
      activeTabId,
      fileProxy,
      file,
    } = this.getProperties(
      '_transfersUpdaterEnabled',
      'space',
      'store',
      'activeTabId',
      'activeListUpdaterId',
      'transfersUpdater',
      'fileProxy',
      'file'
    );

    if (oldTransfersUpdater) {
      oldTransfersUpdater.destroy();
    }
    const transfersUpdater = SpaceTransfersUpdater.create({
      store,
      isEnabled: _transfersUpdaterEnabled,
      scheduledEnabled: activeListUpdaterId === 'scheduled',
      currentEnabled: activeListUpdaterId === 'current',
      transferProgressEnabled: (
        activeTabId === 'scheduled' ||
        activeTabId === 'current'
      ),
      completedEnabled: activeListUpdaterId === 'completed',
      fileEnabled: (
        activeTabId === 'file' &&
        fileProxy &&
        get(fileProxy, 'isFulfilled')
      ),
      space,
      file,
    });

    this.setProperties({
      _ptcCache: A(),
      transfersUpdater,
    });

    return transfersUpdater;
  },

  _spaceChanged(isInit = false) {
    if (!isInit) {
      this._clearFileId();
    }
    this.reinitializeTransfers();
  },

  _clearFileId() {
    return this.get('closeFileTab')();
  },

  reinitializeTransfers() {
    this.initTransfersUpdater();
    ['scheduled', 'current', 'completed'].forEach(type => {
      this.initTransfers(type);
    });
    const listWatcher = this.get('listWatcher');
    if (listWatcher) {
      listWatcher.scrollHandler();
    }
    this.set('listLocked', false);
  },

  // FIXME: maybe to refactor this, detach fake transfers lists from
  // space record and make only lists here
  initTransfers(type) {
    this.get(`${type}TransferList`).then(listRecord => {
      get(listRecord, 'list').then(list => {
        safeExec(this, 'set', `${type}Transfers`, list);
      });
      const visibleIds = listRecord.hasMany('list').ids();
      this.get('transfersUpdater').fetchSpecificRecords(visibleIds);
    });
  },

  // FIXME: compare with new version of onTableScroll from file browser
  /**
   * @param {Array<HTMLElement>} items 
   */
  onTableScroll(items) {
    const {
      activeTabId,
      openedTransfersChunksArray,
      transfersUpdater,
      listLocked,
      listWatcher,
    } = this.getProperties(
      'activeTabId',
      'openedTransfersChunksArray',
      'transfersUpdater',
      'listLocked',
      'listWatcher',
    );
    if (!listLocked) {
      const transferListContent = this.get(`${activeTabId}TransferList.content`);
      if (!transferListContent) {
        return;
      }
      if (items[0] && !items[0].getAttribute('data-row-id')) {
        next(() => {
          openedTransfersChunksArray.fetchPrev().then(() =>
            listWatcher.scrollHandler()
          );
        });
      }
      const allTransferIds = transferListContent.hasMany('list').ids();
      /** @type {Array<string>} */
      const firstNonEmptyRow = items.find(elem => elem.getAttribute('data-row-id'));
      const firstId =
        firstNonEmptyRow && firstNonEmptyRow.getAttribute('data-row-id') || null;
      const lastId = items[items.length - 1] &&
        items[items.length - 1].getAttribute('data-row-id') || null;
      const startIndex = allTransferIds.indexOf(firstId);
      const endIndex = allTransferIds.indexOf(lastId, startIndex);

      const oldVisibleIds = openedTransfersChunksArray.mapBy('id');
      openedTransfersChunksArray.setProperties({ startIndex, endIndex });
      const newVisibleIds = openedTransfersChunksArray.mapBy('id');
      set(transfersUpdater, 'visibleIds', newVisibleIds);

      transfersUpdater.fetchSpecificRecords(_.difference(newVisibleIds, oldVisibleIds));

      next(() => {
        if (startIndex > 0 && get(openedTransfersChunksArray, 'firstObject.id') ===
          firstId) {
          listWatcher.scrollHandler();
        } else {
          this.set('_isTransfersTableBegin', startIndex <= 0);
        }
      });

      const isLoadingMore = (
        get(openedTransfersChunksArray, 'lastObject') !==
        get(openedTransfersChunksArray, 'sourceArray.lastObject')
      );
      this.set(`${activeTabId}TransfersLoadingMore`, isLoadingMore);
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
      if (this.get('_tabJustChangedId') === type) {
        this.set('_tabJustChangedId', null);
      }
    },
    closeFileTab() {
      this.set('activeTabId', 'scheduled');
      this._clearFileId();
    },
  },
});
