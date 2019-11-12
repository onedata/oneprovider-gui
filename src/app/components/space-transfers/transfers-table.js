import Component from '@ember/component';
import { computed } from '@ember/object';
import _ from 'lodash';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { htmlSafe } from '@ember/string';

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
  'actions',
];

const tableExcludedColumnNames = {
  file: ['path'],
  scheduled: ['startedAt', 'finishedAt', 'totalBytes', 'totalFiles'],
  current: ['scheduledAt', 'finishedAt'],
  completed: ['scheduledAt'],
};

export default Component.extend(I18n, {
  classNames: ['transfers-table'],

  /**
   * @override
   */
  i18nPrefix: 'components.spaceTransfers.transfersTable',

  //#region virtual

  /**
   * @virtual
   * @type {Array<Model.Transfer>}
   */
  transfers: undefined,

  /**
   * @virtual
   * Type of transfers in the table, one of: scheduled, current, completed
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

  //#region private properties

  /**
   * If true, component is rendered in mobile mode.
   * @type {boolean}
   */
  mobileMode: false,

  rowHeight: 73,

  //#endregion

  //#region computed properties

  firstRowHeight: computed(
    'rowHeight',
    'transfers._start',
    function firstRowHeight() {
      const _start = this.get('transfers._start');
      const val = _start ? _start * this.get('rowHeight') : 0;
      console.log('first row', val, _start);
      return val;
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
    'mobileMode',
    function tableColumnNames() {
      const {
        transferType,
        mobileMode,
      } = this.getProperties('transferType', 'mobileMode');
      const excludedColumns = [...tableExcludedColumnNames[transferType]];
      if (mobileMode) {
        excludedColumns.push('actions');
      }
      return _.differenceWith(
        allColumnNames,
        excludedColumns,
        (col, eid) => col.id === eid
      );
    }
  ),

  visibleColumns: computed('visibleColumnNames', function visibleColumns() {
    const visibleColumnNames = this.get('visibleColumnNames');
    return Object.values(
      this.getProperties(...visibleColumnNames.map(name => `${name}Column`))
    );
  }),

  //#endregion

  //#region columns computed properties

  pathColumn: computed(function pathColumn() {
    return this.createColumn('path', {
      component: 'cell-data-name',
    });
  }),

  userNameColumn: computed(function userNameColumn() {
    return this.createColumn('userName', {
      component: 'cell-truncated',
    });
  }),

  destinationColumn: computed(function destinationColumn() {
    return this.createColumn('destination', {
      component: 'cell-truncated',
    });
  }),

  scheduledAtColumn: computed(function scheduledAtColumn() {
    return this.createColumn('scheduledAt', {
      propertyName: 'scheduledAtReadable',
    });
  }),

  startedAtColumn: computed(function startedAtColumn() {
    return this.createColumn('startedAt', {
      propertyName: 'startedAtReadable',
    });
  }),

  finishedAtColumn: computed(function finishedAtColumn() {
    return this.createColumn('finishedAt', {
      propertyName: 'finishedAtReadable',
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
    });
  }),

  typeColumn: computed(function typeColumn() {
    return this.createColumn('type', {
      className: 'col-icon',
      component: 'cell-type',
    });
  }),

  actionsColumn: computed(function actionsColumn() {
    return this.createColumn('actions', {
      className: 'transfer-actions-cell',
      component: 'cell-actions',
    });
  }),

  statusColumn: computed(function statusColumn() {
    return this.createColumn('status', {
      className: 'col-icon',
      component: 'cell-status',
    });
  }),

  //#endregion

  //#region methods

  createColumn(id, customData) {
    return Object.assign({
      id,
      propertyName: id,
      component: 'cell-generic',
    }, customData);
  },

  //#endregion
});
