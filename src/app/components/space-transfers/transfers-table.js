/**
 * Lists transfers using replacing chunks array.
 *
 * For each transfer it provides set of available actions and allows to open
 * transfer details (charts, etc.).
 *
 * To get infinite scroll support, see `space-transfers/transfers-table-container`
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import EmberObject, { computed, get, set, setProperties } from '@ember/object';
import _ from 'lodash';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import I18n from 'onedata-gui-common/mixins/i18n';
import { htmlSafe, camelize } from '@ember/string';
import { A } from '@ember/array';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { inject as service } from '@ember/service';
import { sum } from 'ember-awesome-macros';
import isDirectlyClicked from 'onedata-gui-common/utils/is-directly-clicked';
import ColumnsConfiguration from 'oneprovider-gui/utils/columns-configuration';
import DragAndDropColumnOrderMixin from 'oneprovider-gui/mixins/drag-and-drop-column-order';
import WindowResizeHandler from 'onedata-gui-common/mixins/window-resize-handler';
import globals from 'onedata-gui-common/utils/globals';
import TransferTableRecord from 'oneprovider-gui/utils/transfer-table-record';
import { asyncObserver } from 'onedata-gui-common/utils/observer';

const mixins = [
  I18n,
  DragAndDropColumnOrderMixin,
  WindowResizeHandler,
];

const allColumnNames = [
  'path',
  'userName',
  'destination',
  'scheduledAt',
  'startedAt',
  'finishedAt',
  'processed',
  'replicated',
  'evicted',
  'type',
  'status',
];

const allColumnWidth = {
  path: 190,
  userName: 200,
  destination: 200,
  scheduledAt: 150,
  startedAt: 150,
  finishedAt: 155,
  processed: 110,
  replicated: 115,
  evicted: 95,
  type: 80,
  status: 85,
};

const tableExcludedColumnNames = {
  file: ['path'],
  waiting: ['startedAt', 'finishedAt', 'processed', 'replicated', 'evicted'],
  ongoing: ['scheduledAt', 'finishedAt'],
  ended: ['scheduledAt'],
};

export default Component.extend(...mixins, {
  classNames: ['transfers-table', 'one-infinite-list'],

  globalNotify: service(),
  media: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceTransfers.transfersTable',

  //#region Virtual

  /**
   * @virtual
   * @type {ReplacingChunksArray<Model.Transfer>}
   */
  transfers: undefined,

  /**
   * @virtual
   * Type of transfers in the table, one of: waiting, ongoing, ended
   */
  transferType: undefined,

  /**
   * @virtual
   * @type {Array<Model.Provider>}
   */
  providers: undefined,

  /**
   * @virtual
   * @type {Object}
   */
  providersColors: undefined,

  /**
   * @virtual
   * @type {String}
   */
  spaceId: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  rerunTransfer: notImplementedReject,

  /**
   * @virtual
   * @type {Function}
   */
  cancelTransfer: notImplementedReject,

  /**
   * @virtual
   * @type {Function}
   */
  openDbViewModal: notImplementedThrow,

  /**
   * @virtual optional
   * @type {Number}
   */
  rowHeight: 73,

  /**
   * @virtual
   * Keys: scheduleReplication, scheduleEviction, cancelReplication, cancelEviction.
   * If value is true, then the operation is forbidden. Otherwise, operation can be
   * invoked.
   * @type {Object}
   */
  forbiddenOperations: Object.freeze({}),

  //#endregion

  //#region Private properties

  /**
   * @type {boolean}
   * If true, should render top loading indicator
   */
  fetchingPrev: false,

  /**
   * If true, should render bottom loading indicator
   * @type {boolean}
   */
  fetchingNext: false,

  /**
   * @type {Utils.ColumnsConfiguration}
   */
  columnsConfiguration: undefined,

  /**
   * List of transfer EntityIds that are expanded on the view
   * @type {Array<Srting>}
   */
  expandedTransferIds: computed(() => A()),

  /**
   * @type {number}
   */
  windowWidth: undefined,

  //#endregion

  //#region Computed properties

  firstRowHeight: computed(
    'rowHeight',
    'transfers._start',
    function firstRowHeight() {
      const _start = this.get('transfers._start');
      return _start ? _start * this.get('rowHeight') : 0;
    }
  ),

  firstRowStyle: computed('firstRowHeight', function firstRowStyle() {
    return htmlSafe(`height: ${this.get('firstRowHeight')}px;`);
  }),

  /**
   * @type {ComputedProperty<Array<String>>}
   */
  visibleColumnNames: computed(
    'transferType',
    'windowWidth',
    function tableColumnNames() {
      const excludedColumnNames = [
        ...tableExcludedColumnNames[this.get('transferType')],
      ];
      if (this.windowWidth < 400) {
        excludedColumnNames.push('type');
        excludedColumnNames.push('replicated');
      }
      return _.differenceWith(
        allColumnNames,
        excludedColumnNames
      );
    }
  ),

  visibleColumns: computed(
    'visibleColumnNames',
    'columnsConfiguration.{columns,columnsOrder.[]}',
    'media.isMobile',
    function visibleColumns() {
      let columnsConfigurationWithFirstCol = ['path'];
      if (this.media.isMobile) {
        columnsConfigurationWithFirstCol = [
          ...columnsConfigurationWithFirstCol,
          ...this.visibleColumnNames,
        ];
      } else {
        for (const columnName of this.columnsConfiguration.columnsOrder) {
          if (this.columnsConfiguration.columns[columnName].isVisible) {
            columnsConfigurationWithFirstCol.push(columnName);
          }
        }
      }
      return Object.values(
        this.getProperties(...columnsConfigurationWithFirstCol.map(name =>
          `${name}Column`
        ))
      );
    }
  ),

  /**
   * Add columns rendered beside visibleColumns
   * @type {ComputedProperty<number>}
   */
  allColumnsCount: sum('visibleColumns.length', 1),

  /**
   * Internal cancel of transfer which knows which row (table record) invoked
   * the procedure, so it can modify row (record) state.
   * @param {object} record instance of model-table record for which the transfer
   *    has been canceled
   */
  _cancelTransfer: computed('cancelTransfer', function _cancelTransfer() {
    const {
      cancelTransfer,
      globalNotify,
    } = this.getProperties('cancelTransfer', 'globalNotify');
    return cancelTransfer ? (record) => {
      setProperties(record, {
        actionMessage: undefined,
        actionMessageType: undefined,
      });
      set(record, 'transfer.isCancelling', true);
      const transfer = get(record, 'transfer');
      return cancelTransfer(transfer)
        .catch(error => {
          globalNotify.backendError(this.t('cancellation'), error);
          safeExec(record, () => setProperties(record, {
            actionMessage: this.t('cancelFailure'),
            actionMessageType: 'failure',
          }));
          safeExec(transfer, 'set', 'isCancelling', false);
          throw error;
        })
        .then(() => {
          return transfer.reload()
            .then(transfer => transfer.updateTransferProgressProxy());
        });
    } : undefined;
  }),

  /**
   * Internal rerun of transfer which knows which row (table record) invoked
   * the procedure, so it can modify row (record) state.
   * @param {object} record instance of model-table record for which the transfer
   *    has been rerun
   */
  _rerunTransfer: computed('rerunTransfer', function _rerunTransfer() {
    const {
      rerunTransfer,
      globalNotify,
    } = this.getProperties('rerunTransfer', 'globalNotify');
    return rerunTransfer ? (record) => {
      setProperties(record, {
        actionMessage: this.t('rerunStarting'),
        actionMessageType: 'warning',
        isRerunning: true,
      });
      const transfer = get(record, 'transfer');
      return rerunTransfer(transfer)
        .catch(error => {
          // TODO: consider clearing isRerunning flag and reload progress
          setProperties(record, {
            actionMessage: this.t('rerunFailure'),
            actionMessageType: 'failure',
          });
          globalNotify.backendError(this.t('rerunning'));
          throw error;
        })
        .then(() => {
          setProperties(record, {
            actionMessage: this.t('rerunSuccess'),
            actionMessageType: 'success',
          });
          return transfer.reload()
            .then(transfer => transfer.updateTransferProgressProxy());
        })
        .finally(() => {
          record.set('isRerunning', false);
        });
    } : undefined;
  }),

  /**
   * @type {Ember.ComputedProperty<Array<Object>>}
   */
  transferActions: computed(
    '_cancelTransfer',
    '_rerunTransfer',
    function transferActions() {
      const {
        _cancelTransfer,
        _rerunTransfer,
      } = this.getProperties('_cancelTransfer', '_rerunTransfer');
      const actions = [];
      if (_cancelTransfer) {
        actions.push({
          id: 'cancelTransfer',
          action: _cancelTransfer,
        });
      }
      if (_rerunTransfer) {
        actions.push({
          id: 'rerunTransfer',
          action: _rerunTransfer,
        });
      }
      return actions;
    }
  ),

  /**
   * @type {Map<Model.Transfer, TransferTableRecord>}
   */
  transferRecordsCache: undefined,

  transferRecords: computed('transfers.[]', function transferRecords() {
    const tableRecords = this.transfers.map(transfer =>
      this.getTransferTableRecord(transfer)
    );
    return tableRecords;
  }),

  tableRecordsCleaner: asyncObserver('transfers.[]', function tableRecordsCleaner() {
    this.deleteUnusedTableRecordsCache();
  }),

  deleteUnusedTableRecordsCache() {
    /** @type {Map<Models.Transfer, TransferTableRecord>} */
    const transferRecordsCache = this.transferRecordsCache;
    for (const transfer of transferRecordsCache.keys()) {
      if (!this.transfers.includes(transfer)) {
        transferRecordsCache.delete(transfer);
      }
    }
  },

  /**
   * @param {Models.Transfer} transfer
   * @returns {TransferTableRecord}
   */
  getTransferTableRecord(transfer) {
    const {
      transfers,
      providers,
      spaceId,
      transferType: transferCollection,
      providersColors,
      transferActions,
      transferRecordsCache,
    } = this;
    let tableRecord = transferRecordsCache.get(transfer);
    if (!tableRecord) {
      tableRecord = TransferTableRecord.create({
        ownerSource: this,
        transfer,
        transfers,
        providers,
        spaceId,
        transferCollection,
        providersColors,
        transferActions,
      });
      transferRecordsCache.set(transfer, tableRecord);
    }
    return tableRecord;
  },

  //#endregion

  //#region Columns computed properties

  pathColumn: computed(function pathColumn() {
    return this.createColumn('path', {
      component: 'cell-data-name',
    });
  }),

  userNameColumn: computed(function userNameColumn() {
    return this.createColumn('userName', {
      component: 'cell-user',
      className: 'hidden-xs',
    });
  }),

  destinationColumn: computed(function destinationColumn() {
    return this.createColumn('destination', {
      component: 'cell-truncated',
      className: 'hidden-xs',
    });
  }),

  scheduledAtColumn: computed(function scheduledAtColumn() {
    return this.createColumn('scheduledAt', {
      propertyName: 'scheduledAtReadable',
      className: 'hidden-xs',
    });
  }),

  startedAtColumn: computed(function startedAtColumn() {
    return this.createColumn('startedAt', {
      propertyName: 'startedAtReadable',
      className: 'hidden-xs',
    });
  }),

  finishedAtColumn: computed(function finishedAtColumn() {
    return this.createColumn('finishedAt', {
      propertyName: 'finishedAtReadable',
      className: 'hidden-xs',
    });
  }),

  processedColumn: computed(function processedColumn() {
    return this.createColumn('processed', {
      component: 'cell-processed',
      className: 'hidden-xs',
    });
  }),

  replicatedColumn: computed(function replicatedColumn() {
    return this.createColumn('replicated', {
      component: 'cell-replicated',
    });
  }),

  evictedColumn: computed(function evictedColumn() {
    return this.createColumn('evicted', {
      component: 'cell-evicted',
      className: 'hidden-xs',
    });
  }),

  typeColumn: computed(function typeColumn() {
    return this.createColumn('type', {
      className: 'col-icon',
      component: 'cell-type',
    });
  }),

  statusColumn: computed(function statusColumn() {
    return this.createColumn('status', {
      className: 'col-icon',
      component: 'cell-status',
    });
  }),

  //#endregion

  init() {
    this._super(...arguments);
    this.registerArrayLoadingHandlers();
    this.attachWindowResizeHandler();
    this.setProperties({
      columnsConfiguration: this.createColumnsConfiguration(),
      transferRecordsCache: new Map(),
    });
  },

  /**
   * @override
   */
  didInsertElement() {
    this._super(...arguments);
    const transfersTableThead = this.element?.querySelector('.transfers-table-thead');
    this.onWindowResize();
    this.set('columnsConfiguration.tableThead', transfersTableThead);
    this.columnsConfiguration.checkColumnsVisibility();
  },

  /**
   * @override
   */
  willDestroy() {
    this._super(...arguments);
    this.detachWindowResizeHandler();
  },

  //#region Methods

  /**
   * @returns {Utils.ColumnsConfiguration}
   */
  createColumnsConfiguration() {
    const columns = {};
    const visibleColumnNames = [...this.visibleColumnNames];
    visibleColumnNames.shift();
    for (const columnName of visibleColumnNames) {
      columns[columnName] = EmberObject.create({
        isVisible: true,
        isEnabled: true,
        width: allColumnWidth[columnName],
      });
    }
    const columnsOrder = visibleColumnNames;
    return ColumnsConfiguration.create({
      configurationType: 'transfer.' + this.transferType,
      columns,
      columnsOrder,
      firstColumnWidth: allColumnWidth['path'],
    });
  },

  createColumn(id, customData) {
    return Object.assign({
      id,
      propertyName: id,
      component: 'cell-generic',
    }, customData);
  },

  registerArrayLoadingHandlers() {
    const array = this.get('transfers');
    array.on(
      'fetchPrevStarted',
      () => this.onFetchingStateUpdate('prev', 'started')
    );
    array.on(
      'fetchPrevResolved',
      () => this.onFetchingStateUpdate('prev', 'resolved')
    );
    array.on(
      'fetchPrevRejected',
      () => this.onFetchingStateUpdate('prev', 'rejected')
    );
    array.on(
      'fetchNextStarted',
      () => this.onFetchingStateUpdate('next', 'started')
    );
    array.on(
      'fetchNextResolved',
      () => this.onFetchingStateUpdate('next', 'resolved')
    );
    array.on(
      'fetchNextRejected',
      () => this.onFetchingStateUpdate('next', 'rejected')
    );
  },

  /**
   * @param {string} type one of: prev, next
   * @param {string} state one of: started, resolved, rejected
   * @returns {undefined}
   */
  onFetchingStateUpdate(type, state) {
    safeExec(
      this,
      'set',
      camelize(`fetching-${type}`),
      state === 'started'
    );
  },

  onWindowResize() {
    safeExec(this, 'set', 'windowWidth', globals.window.innerWidth);
  },

  //#endregion

  //#region Actions

  actions: {
    toggleTransferDetails(transferId, open, event) {
      if (!isDirectlyClicked(event)) {
        return;
      }

      const expandedTransferIds = this.get('expandedTransferIds');
      let _open;
      if (typeof open === 'boolean') {
        _open = open;
      } else {
        _open = !expandedTransferIds.includes(transferId);
      }
      if (_open) {
        expandedTransferIds.pushObject(transferId);
      } else {
        expandedTransferIds.removeObject(transferId);
      }
    },
    openDbViewModal() {
      return this.get('openDbViewModal')(...arguments);
    },
  },

  //#endregion
});
