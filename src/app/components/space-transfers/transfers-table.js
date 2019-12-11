import Component from '@ember/component';
import { computed, get, set, setProperties } from '@ember/object';
import _ from 'lodash';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { htmlSafe, camelize } from '@ember/string';
import { A } from '@ember/array';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { inject as service } from '@ember/service';

const allColumnNames = [
  'path',
  'userName',
  'destination',
  'scheduledAt',
  'startedAt',
  'finishedAt',
  'totalBytes',
  'totalFiles',
  'type',
  'status',
];

const tableExcludedColumnNames = {
  file: ['path'],
  waiting: ['startedAt', 'finishedAt', 'totalBytes', 'totalFiles'],
  ongoing: ['scheduledAt', 'finishedAt'],
  ended: ['scheduledAt'],
};

export default Component.extend(I18n, {
  classNames: ['transfers-table', 'one-infinite-list'],

  globalNotify: service(),

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
  updaterId: undefined,

  /**
   * @virtual
   * @type {String}
   */
  spaceId: undefined,

  /**
   * @virtual
   * FIXME: Seems to be not used, but was used in legacy live-stats-table
   */
  notifyTransferListChanged: undefined,

  /**
   * @virtual
   * FIXME: to use
   */
  justOpened: undefined,

  /**
   * @virtual
   * FIXME: to use
   */
  clearJustOpened: undefined,

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

  //#endregion

  //#region Private properties

  // FIXME: where this value is set?
  /**
   * If true, component is rendered in mobile mode.
   * @type {boolean}
   */
  mobileMode: false,

  rowHeight: 73,

  fetchingPrev: false,

  fetchingNext: false,

  expandedTransferIds: computed(() => A()),

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
    function tableColumnNames() {
      const {
        transferType,
      } = this.getProperties('transferType');
      const excludedColumnNames = [...tableExcludedColumnNames[transferType]];
      return _.differenceWith(
        allColumnNames,
        excludedColumnNames
      );
    }
  ),

  visibleColumns: computed('visibleColumnNames', function visibleColumns() {
    const visibleColumnNames = this.get('visibleColumnNames');
    return Object.values(
      this.getProperties(...visibleColumnNames.map(name => `${name}Column`))
    );
  }),

  /**
   * Add columns rendered beside visibleColumns
   * @type {number}
   */
  allColumnsCount: computed('visibleColumns.length', function allColumnsCount() {
    return this.get('visibleColumns.length') + 1;
  }),

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
          globalNotify.success(this.t('rerunSuccess'));
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
  transferActions: computed('_cancelTransfer', '_rerunTransfer', function () {
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
  }),

  //#endregion

  //#region Columns computed properties

  pathColumn: computed(function pathColumn() {
    return this.createColumn('path', {
      component: 'cell-data-name',
    });
  }),

  userNameColumn: computed(function userNameColumn() {
    return this.createColumn('userName', {
      component: 'cell-truncated',
      className: 'col-hide-2',
    });
  }),

  destinationColumn: computed(function destinationColumn() {
    return this.createColumn('destination', {
      component: 'cell-truncated',
      className: 'col-hide-3',
    });
  }),

  scheduledAtColumn: computed(function scheduledAtColumn() {
    return this.createColumn('scheduledAt', {
      propertyName: 'scheduledAtReadable',
      className: 'col-hide-5',
    });
  }),

  startedAtColumn: computed(function startedAtColumn() {
    return this.createColumn('startedAt', {
      propertyName: 'startedAtReadable',
      className: 'col-hide-4',
    });
  }),

  finishedAtColumn: computed(function finishedAtColumn() {
    return this.createColumn('finishedAt', {
      propertyName: 'finishedAtReadable',
      className: 'col-hide-4',
    });
  }),

  totalBytesColumn: computed(function totalBytesColumn() {
    return this.createColumn('totalBytes', {
      propertyName: 'totalBytesReadable',
      component: 'cell-errorable',
    });
  }),

  totalFilesColumn: computed(function totalFilesColumn() {
    return this.createColumn('totalFiles', {
      component: 'cell-total-files',
      className: 'col-hide-1',
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
    // FIXME: debug
    window.transfersTable = this;
    this.registerArrayLoadingHandlers();
  },

  //#region Methods

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

  //#endregion

  //#region Actions

  actions: {
    toggleTransferDetails(transferId, open) {
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
  },

  //#endregion
});
