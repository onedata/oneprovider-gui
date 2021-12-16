import Component from '@ember/component';
import { computed, get, getProperties, observer } from '@ember/object';
import { htmlSafe } from '@ember/string';
import ReplacingChunksArray from 'onedata-gui-common/utils/replacing-chunks-array';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import Looper from 'onedata-gui-common/utils/looper';
import { next } from '@ember/runloop';
import ListWatcher from 'onedata-gui-common/utils/list-watcher';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';

/**
 * @typedef {Object} EventsTableApi
 * @property {() => void} recomputeTableItems
 */

export default Component.extend(I18n, {
  classNames: ['events-table'],

  workflowManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.modals.atmTaskExecutionPodsActivityModal.eventsTable',

  /**
   * @virtual
   * @type {string}
   */
  atmTaskExecutionId: undefined,

  /**
   * @virtual
   * @type {string}
   */
  podId: undefined,

  /**
   * @virtual optional
   * @type {(api: EventsTableApi) => void}
   */
  registerApi: undefined,

  /**
   * @type {string}
   */
  expandedRowIndex: undefined,

  /**
   * @type {Utils.ListWatcher}
   */
  listWatcher: undefined,

  /**
   * @type {boolean}
   */
  tableTopVisible: true,

  /**
   * @type {number}
   */
  rowHeight: 55,

  /**
   * @type {number}
   */
  updateInterval: 3000,

  /**
   * @type {Utils.Looper}
   */
  updater: undefined,

  /**
   * If true, should render top loading indicator
   * @type {boolean}
   */
  fetchingPrev: false,

  /**
   * If true, should render bottom loading indicator
   * @type {boolean}
   */
  fetchingNext: false,

  /**
   * @type {Window}
   */
  _window: window,

  /**
   * @type {ComputedProperty<EventsTableApi>}
   */
  api: computed(function api() {
    return {
      recomputeTableItems: () => safeExec(this, () => {
        const listWatcher = this.get('listWatcher');
        if (listWatcher) {
          listWatcher.scrollHandler();
        }
      }),
    };
  }),

  /**
   * @type {ComputedProperty<number>}
   */
  firstRowHeight: computed(
    'rowHeight',
    'eventsEntries._start',
    function firstRowHeight() {
      const _start = this.get('eventsEntries._start');
      return _start ? _start * this.get('rowHeight') : 0;
    }
  ),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  firstRowStyle: computed('firstRowHeight', function firstRowStyle() {
    return htmlSafe(`height: ${this.get('firstRowHeight')}px;`);
  }),

  /**
   * @type {ComputedProperty<ReplacingChunksArray<JsonInfiniteLogEntry<OpenfaasFunctionEvent>>>}
   */
  eventsEntries: computed('taskId', 'podId', function eventsEntries() {
    const rca = ReplacingChunksArray.create({
      fetch: this.fetchEventsEntries.bind(this),
      startIndex: 0,
      endIndex: 50,
      indexMargin: 10,
    });
    rca.on('fetchPrevStarted', () => this.set('fetchingPrev', true));
    rca.on('fetchPrevResolved', () => this.set('fetchingPrev', false));
    rca.on('fetchPrevRejected', () => this.set('fetchingPrev', false));
    rca.on('fetchNextStarted', () => this.set('fetchingNext', true));
    rca.on('fetchNextResolved', () => this.set('fetchingNext', false));
    rca.on('fetchNextRejected', () => this.set('fetchingNext', false));
    return rca;
  }),

  eventsEntriesLoadedObserver: observer(
    'eventsEntries.isLoaded',
    function eventsEntriesLoadedObserver() {
      if (!this.get('eventsEntries.isLoaded')) {
        return;
      }

      const existingListWatcher = this.get('listWatcher');
      if (existingListWatcher) {
        existingListWatcher.destroy();
      }
      next(() => safeExec(this, () => {
        const listWatcher = this.set('listWatcher', this.createListWatcher());
        listWatcher.scrollHandler();
      }));

      this.set('expandedRowIndex', undefined);
    }
  ),

  registerApiCaller: observer('registerApi', 'api', function registerApiCaller() {
    const {
      api,
      registerApi,
    } = this.getProperties('registerApi', 'api');
    if (registerApi) {
      registerApi(api);
    }
  }),

  init() {
    this._super(...arguments);
    this.registerApiCaller();
    this.eventsEntriesLoadedObserver();
    this.startUpdater();
  },

  willDestroyElement() {
    try {
      const listWatcher = this.get('listWatcher');
      listWatcher && listWatcher.destroy();
      this.stopUpdater();
    } finally {
      this._super(...arguments);
    }
  },

  startUpdater() {
    const updater = Looper.create({
      immediate: false,
      interval: this.get('updateInterval'),
    });
    updater.on('tick', () => {
      // this.updateEventsEntries();
    });
    this.set('updater', updater);
  },

  stopUpdater() {
    const updater = this.get('updater');
    updater && safeExec(updater, () => updater.destroy());
  },

  async fetchEventsEntries(index, limit, offset) {
    const {
      atmTaskExecutionId,
      podId,
      workflowManager,
    } = this.getProperties('atmTaskExecutionId', 'podId', 'workflowManager');
    const result = await workflowManager
      .getAtmTaskExecutionOpenfaasPodEventLogs(
        atmTaskExecutionId,
        podId, {
          index,
          limit,
          offset,
        }
      );
    const entries = result && result.array;
    // Infinite log entries does not have id, which is required by replacing chunks array.
    // Solution: using entry index as id.
    entries && entries.forEach(entry => entry.id = entry.index);

    return result;
  },

  async updateEventsEntries() {
    const {
      tableTopVisible,
      eventsEntries,
    } = this.getProperties('tableTopVisible', 'eventsEntries');
    if (tableTopVisible && get(eventsEntries, 'isLoaded')) {
      await eventsEntries.scheduleReload();
    }
  },

  createListWatcher() {
    return new ListWatcher(
      this.$('.ps'),
      '.data-row',
      (items, headerVisible) => {
        if (this.$().parents('.global-modal').hasClass('in')) {
          return safeExec(this, 'onTableScroll', items, headerVisible);
        }
      },
      '.table-start-row'
    );
  },

  /**
   * @param {Array<HTMLElement>} items
   * @param {boolean} headerVisible
   */
  onTableScroll(items, headerVisible) {
    const {
      eventsEntries,
    } = this.getProperties(
      'eventsEntries',
    );
    const sourceArray = get(eventsEntries, 'sourceArray');

    const eventsEntriesIds = sourceArray.mapBy('id');
    const firstNonEmptyRow = items.find(elem => elem.getAttribute('data-row-id'));
    const firstId =
      firstNonEmptyRow && firstNonEmptyRow.getAttribute('data-row-id') || null;
    const lastId = items[items.length - 1] &&
      items[items.length - 1].getAttribute('data-row-id') || null;

    let startIndex;
    let endIndex;
    if (firstId === null && get(sourceArray, 'length') !== 0) {
      const {
        _window,
        rowHeight,
      } = this.getProperties('_window', 'rowHeight');
      const $firstRow = this.$('.first-row');
      const firstRowTop = $firstRow.offset().top;
      const blankStart = firstRowTop * -1;
      const blankEnd = blankStart + _window.innerHeight;
      startIndex = firstRowTop < 0 ? Math.floor(blankStart / rowHeight) : 0;
      endIndex = Math.floor(blankEnd / rowHeight);
      if (endIndex < 0) {
        endIndex = 50;
      }
    } else {
      startIndex = eventsEntriesIds.indexOf(firstId);
      endIndex = eventsEntriesIds.indexOf(lastId, startIndex);
    }

    const {
      startIndex: oldStartIndex,
      endIndex: oldEndIndex,
    } = getProperties(eventsEntries, 'startIndex', 'endIndex');
    if (oldStartIndex !== startIndex || oldEndIndex !== endIndex) {
      eventsEntries.setProperties({ startIndex, endIndex });
    }
    safeExec(this, 'set', 'tableTopVisible', headerVisible);
    if (headerVisible) {
      // schedule update immediately to see new records just after scrolling up
      this.updateEventsEntries();
    }
  },

  actions: {
    toggleRowExpand(rowIndex) {
      this.set(
        'expandedRowIndex',
        rowIndex === this.get('expandedRowIndex') ? undefined : rowIndex
      );
    },
  },
});
