/**
 * Table listing transfers with details show on click.
 * 
 * Works in two modes: desktop (models-table) or mobile (one-collapsible-list)
 *
 * @module components/space-space-transfers/live-stats-table
 * @author Michal Borzecki, Jakub Liput
 * @copyright (C) 2017-2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import TransferTableRecord from 'oneprovider-gui/utils/transfer-table-record';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import _ from 'lodash';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import EmberObject, {
  computed,
  get,
  set,
  setProperties,
  observer,
} from '@ember/object';
import { reads, lt } from '@ember/object/computed';
import { next, scheduleOnce } from '@ember/runloop';
import { A } from '@ember/array';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

const tableExcludedColumns = {
  file: ['path'],
  scheduled: ['startedAt', 'finishedAt', 'totalBytes', 'totalFiles'],
  current: ['scheduledAt', 'finishedAt'],
  completed: ['scheduledAt'],
};

export default Component.extend(I18n, {
  classNames: ['transfers-live-stats-table', 'transfers-table'],
  classNameBindings: ['transferType'],

  i18n: service(),
  notify: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceTransfers.liveStatsTable',

  /**
   * @virtual 
   * @type {ReplacingChunksArray<Transfer>}
   */
  transfers: undefined,

  /**
   *
   * @virtual
   * @type {Array<Provider>}
   */
  providers: undefined,

  /**
   * @virtual 
   * @type {Function}
   */
  notifyLoaded: notImplementedIgnore,

  /**
   * @virtual
   * @type {Function}
   * External implementation of cancelTransfer that should actually invoke
   * a procedure
   * @returns {Promise<any>} promise should resolve when cancelling has
   *    started successfully
   */
  cancelTransfer: undefined,

  /**
   * @virtual
   * @type {Function}
   * External implementation of rerunTransfer that should actually invoke
   * a procedure
   * @returns {Promise<any>} promise should resolve when rerunning has
   *    started successfully
   */
  rerunTransfer: undefined,

  /**
   * @virtual 
   * @type {Function}
   */
  notifyTransferListChanged: notImplementedIgnore,

  /**
   * @virtual 
   * @type {Function} (boolean) => undefined
   */
  stickyTableChanged: notImplementedIgnore,

  /**
   * Type of transfers. May be `scheduled`, `current` or `completed`
   * @public
   * @type {string}
   */
  transferType: 'current',

  /**
   * @virtual
   * If true, table was just showed to user, so some additional
   * styles/operations, etc. should be performed
   * @type {boolean}
   */
  justOpened: false,

  /**
   * @virtual
   * Invoke this function after operations associated with fresh opened
   * table have been finished (see `justOpened` flag)
   * @type {Function}
   */
  clearJustOpened: notImplementedIgnore,

  /**
   * @type {EmberObject}
   */
  firstRowSpace: undefined,

  /**
   * If true, component is rendered in mobile mode.
   * @type {boolean}
   */
  _mobileMode: false,

  /**
   * Window object (for testing purposes).
   * @type {Window}
   */
  _window: window,

  /**
   * @type {number}
   */
  _stickyTableHeaderOffset: 0,

  /**
   * @type {Array<Object>}
   */
  _tableDataCache: null,

  /**
   * True if table has no data (except virtual rows)
   * @type {Ember.ComputedProperty<boolean>}
   */
  _tableDataEmpty: lt('_tableData.length', 2),

  /**
   * True if the list is reloaded.
   * Note, it is still false if fetching more data or particular records 
   * are reloaded.
   * @type {Ember.ComputedProperty<boolean>}
   */
  _isReloading: reads('transfers.isReloading'),

  /**
   * @type {ComputedProperty<any>}
   */
  _transfersError: reads('transfers.error'),

  /**
   * Custom icons for ember-models-table addon.
   * @type {Ember.Object}
   */
  _tableCustomIcons: computed(() => EmberObject.create({
    'sort-asc': 'oneicon oneicon-arrow-up',
    'sort-desc': 'oneicon oneicon-arrow-down',
  })),

  /**
   * Custom classes for ember-models-table addon.
   * @type {Ember.Object}
   */
  _tableCustomClasses: computed(function _tableCustomClasses() {
    return EmberObject.create({
      table: 'table',
    });
  }),

  /**
   * Custom messages for ember-models-table addon.
   * @type {Ember.Object}
   */
  _tableCustomMessages: computed('transferType', function _tableCustomMessages() {
    const messageId = `noTransfers.${this.get('transferType')}`;
    return EmberObject.create({
      noDataToShow: this.t(messageId),
    });
  }),

  _tableData: computed(
    'transfers.{[],startIndex,endIndex}',
    'providers',
    'providersColors',
    '_rowActions',
    function _tableData() {
      const {
        transfers,
        providers,
        providersColors,
        _tableDataCache,
        firstRowSpace,
        updaterId,
        _rowActions,
        transferType,
      } = this.getProperties(
        'transfers',
        'providers',
        'providersColors',
        '_tableDataCache',
        'firstRowSpace',
        'updaterId',
        '_rowActions',
        'transferType'
      );

      if (transfers && providers) {
        let arrayChanged = false;
        const cachedTransfers = _tableDataCache.mapBy('transfer');
        const initialCacheLength = get(_tableDataCache, 'length');
        _.pullAllWith(
          _tableDataCache,
          _.difference(
            cachedTransfers,
            transfers.toArray()
          ),
          (cached, transfer) => {
            const ct = get(cached, 'transfer');
            return cached && transfer && ct === transfer;
          }
        );
        if (get(_tableDataCache, 'length') !== initialCacheLength) {
          arrayChanged = true;
        }

        transfers.forEach(transfer => {
          if (!_.includes(cachedTransfers, transfer)) {
            const transferId = get(transfer, 'id');
            // force load record
            if (!get(transfer, 'isLoaded') && !get(transfer, 'isLoading')) {
              transfer.store.findRecord('transfer', transferId);
            }
            _tableDataCache.push(TransferTableRecord.create({
              transfer,
              transfers,
              providers,
              providersColors,
              updaterId,
              actions: _rowActions,
              transferCollection: transferType,
            }));
            arrayChanged = true;
          }
        });
        let needSort = false;
        for (let i = 0; i < get(_tableDataCache, 'length') - 1; ++i) {
          if (get(_tableDataCache[i], 'listIndex') >= get(_tableDataCache[i + 1],
              'listIndex')) {
            needSort = true;
            break;
          }
        }
        if (needSort) {
          _tableDataCache.sort((a, b) => get(a, 'listIndex') - get(b, 'listIndex'));
          arrayChanged = true;
        }
        const topRecord = _tableDataCache[1];
        set(
          firstRowSpace,
          'firstRowListIndex',
          topRecord && get(topRecord, 'listIndex')
        );
        if (arrayChanged) {
          _tableDataCache.arrayContentDidChange();
        }
      }

      return _tableDataCache;
    }
  ),

  /**
   * Table columns definition.
   * @type {Ember.ComputedProperty<Array<Object>>}
   */
  _tableColumns: computed('transferType', '_mobileMode', function _tableColumns() {
    const {
      transferType,
      _mobileMode,
    } = this.getProperties('transferType', '_mobileMode');
    const excludedColumns = tableExcludedColumns[transferType];

    // field `id` is custom and is used only to check which column should be 
    // filtered out for active/completed table version
    const allColumns = [{
        id: 'listIndex',
        propertyName: 'listIndex',
        isHidden: true,
        sortDirection: 'asc',
        sortPrecedence: 1,
      },
      {
        id: 'path',
        propertyName: 'path',
        title: this.t('path'),
        component: _mobileMode ?
          undefined : 'space-transfers/live-stats-table/cell-data-name',
      }, {
        id: 'userName',
        propertyName: 'userName',
        title: this.t('userName'),
        component: _mobileMode ?
          undefined : 'space-transfers/live-stats-table/cell-truncated',
      }, {
        id: 'destination',
        propertyName: 'destination',
        title: this.t('destination'),
        component: _mobileMode ?
          undefined : 'space-transfers/live-stats-table/cell-truncated',
      }, {
        id: 'scheduledAt',
        propertyName: 'scheduledAtReadable',
        title: this.t('scheduledAt'),
      }, {
        id: 'startedAt',
        propertyName: 'startedAtReadable',
        title: this.t('startedAt'),
      }, {
        id: 'finishedAt',
        propertyName: 'finishedAtReadable',
        title: this.t('finishedAt'),
      }, {
        id: 'totalBytes',
        propertyName: 'totalBytesReadable',
        title: this.t('totalBytes'),
        component: 'space-transfers/live-stats-table/cell-errorable',
      }, {
        id: 'totalFiles',
        propertyName: 'totalFiles',
        title: this.t('totalFiles'),
        component: 'space-transfers/live-stats-table/cell-total-files',
      },
      {
        id: 'type',
        propertyName: 'type',
        className: 'col-icon',
        title: this.t('type'),
        component: _mobileMode ? undefined :
          'space-transfers/live-stats-table/cell-type',
      },
      {
        id: 'status',
        propertyName: 'status',
        className: 'col-icon',
        title: this.t('status'),
        component: 'space-transfers/live-stats-table/cell-status',
      },
    ];
    if (!_mobileMode) {
      allColumns.push({
        id: 'actions',
        component: 'space-transfers/live-stats-table/cell-actions',
        className: 'transfer-actions-cell',
      });
    }
    allColumns.forEach(column => column.disableSorting = true);
    return _.differenceWith(
      allColumns,
      excludedColumns,
      (col, eid) => col.id === eid
    );
  }),

  /**
   * Window resize event handler.
   * @type {Ember.ComputedProperty<Function>}
   */
  _resizeEventHandler: computed(function _resizeEventHandler() {
    return () => {
      this.set('_mobileMode', this.get('_window.innerWidth') < 1200);
    };
  }),

  _hasExpandableRows: computed('transferType', function getExpandableRows() {
    const transferType = this.get('transferType');
    return transferType !== 'scheduled';
  }),

  /**
   * Internal cancel of transfer which knows which row (table record) invoked
   * the procedure, so it can modify row (record) state.
   * @param {object} record instance of model-table record for which the transfer
   *    has been canceled
   */
  _cancelTransfer: computed('cancelTransfer', function _cancelTransfer() {
    const cancelTransfer = this.get('cancelTransfer');
    return cancelTransfer ? (record) => {
      const notify = this.get('notify');
      setProperties(record, {
        actionMessage: undefined,
        actionMessageType: undefined,
      });
      set(record, 'transfer.isCancelling', true);
      cancelTransfer(get(record, 'transfer.id'))
        .catch(error => {
          notify.error(this.t('cancelFailure'));
          safeExec(record, () => setProperties(record, {
            actionMessage: this.t('cancelFailure'),
            actionMessageType: 'failure',
          }));
          safeExec(get(record, 'transfer'), 'set', 'isCancelling', false);
          throw error;
        })
        .then(() => {
          return record.transfer.reload();
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
    const rerunTransfer = this.get('rerunTransfer');
    return rerunTransfer ? (record) => {
      const notify = this.get('notify');
      setProperties(record, {
        actionMessage: this.t('rerunStarting'),
        actionMessageType: 'warning',
        isRerunning: true,
      });
      rerunTransfer(get(record, 'transfer.id'))
        .catch(error => {
          setProperties(record, {
            actionMessage: this.t('rerunFailure'),
            actionMessageType: 'failure',
          });
          notify.error(this.t('rerunFailure'));
          throw error;
        })
        .then(() => {
          setProperties(record, {
            actionMessage: this.t('rerunSuccess'),
            actionMessageType: 'success',
          });
          notify.success(this.t('rerunSuccess'));
          return record.transfer.reload();
        })
        .finally(() => {
          record.set('isRerunning', false);
        });
    } : undefined;
  }),

  /**
   * @type {Ember.ComputedProperty<Array<Object>>}
   */
  _rowActions: computed('_cancelTransfer', '_rerunTransfer', function _rowActions() {
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

  transferListChanged: observer(
    '_tableDataCache.[]',
    function transferListChanged() {
      scheduleOnce(
        'afterRender',
        this,
        'notifyTransferListChanged',
        this.get('transferType')
      );
    }
  ),

  isReloadingFinished: observer(
    'justOpened',
    '_isReloading',
    function isReloadingFinished() {
      if (this.get('justOpened') && !this.get('_isReloading')) {
        this.get('clearJustOpened')();
      }
    }
  ),

  init() {
    this._super(...arguments);

    const {
      _resizeEventHandler,
      _window,
    } = this.getProperties('_resizeEventHandler', '_window');

    const firstRowSpace = this.set(
      'firstRowSpace',
      EmberObject.create({ firstRowSpace: true, listIndex: -1 })
    );

    this.set(
      '_tableDataCache',
      A([firstRowSpace])
    );

    _resizeEventHandler();
    _window.addEventListener('resize', _resizeEventHandler);

    next(() => {
      safeExec(this, 'isReloadingFinished');
    });
    this.notifyTransferListChanged();
  },

  willDestroyElement() {
    try {
      let {
        _resizeEventHandler,
        _window,
      } = this.getProperties('_resizeEventHandler', '_window');
      _window.removeEventListener('resize', _resizeEventHandler);
    } finally {
      this._super(...arguments);
    }
  },

  actions: {
    stickyHeaderChanged(state) {
      this.get('stickyTableChanged')(state);
    },
  },
});
