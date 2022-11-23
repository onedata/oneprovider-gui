import Component from '@ember/component';
import { computed, get } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import ReplacingChunksArray from 'onedata-gui-common/utils/replacing-chunks-array';
import atmWorkflowExecutionSummaryIndex from 'oneprovider-gui/utils/atm-workflow-execution-summary-index';
import Looper from 'onedata-gui-common/utils/looper';
import { next } from '@ember/runloop';
import ListWatcher from 'onedata-gui-common/utils/list-watcher';
import $ from 'jquery';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { isEmpty } from '@ember/utils';
import { htmlSafe } from '@ember/string';
import { AtmWorkflowExecutionPhase } from 'onedata-gui-common/utils/workflow-visualiser/statuses';

// TODO: VFS-7803 DRY in infinite scrollable lists

export default Component.extend(I18n, {
  classNames: ['atm-workflow-executions-table'],

  i18n: service(),
  workflowManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceAutomation.atmWorkflowExecutionsTable',

  /**
   * @virtual
   * @type {AtmWorkflowExecutionPhase}
   */
  phase: undefined,

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual optional
   * @type {(atmWorkflowExecutionSummary: Models.AtmWorkflowExecutionSummary, operation: AtmWorkflowExecutionLifecycleChangingOperation') => void}
   */
  onAtmWorkflowExecutionLifecycleChange: undefined,

  /**
   * @type {Function}
   * @param {Models.AtmWorkflowExecutionSummary}
   * @returns {any}
   */
  onAtmWorkflowExecutionSelect: undefined,

  /**
   * @type {Number}
   */
  rowHeight: 61,

  /**
   * @type {Number}
   */
  updateInterval: 5000,

  /**
   * @type {Utils.Looper}
   */
  updater: undefined,

  /**
   * If true, should render top loading indicator
   * @type {Boolean}
   */
  fetchingPrev: false,

  /**
   * If true, should render bottom loading indicator
   * @type {Boolean}
   */
  fetchingNext: false,

  /**
   * @type {Window}
   */
  _window: window,

  /**
   * @type {ComputedProperty<Array<String>>}
   */
  columns: computed('phase', function columns() {
    const phaseColumns = ['name', 'inventory'];

    switch (this.phase) {
      case AtmWorkflowExecutionPhase.Waiting:
        phaseColumns.push('scheduledAt');
        break;
      case AtmWorkflowExecutionPhase.Ongoing:
        phaseColumns.push('startedAt');
        break;
      case AtmWorkflowExecutionPhase.Ended:
        phaseColumns.push('startedAt', 'finishedAt');
        break;
      case AtmWorkflowExecutionPhase.Suspended:
        phaseColumns.push('suspendedAt');
        break;
    }

    phaseColumns.push('status', 'actions');
    return phaseColumns;
  }),

  /**
   * @type {ComputedProperty<Number>}
   */
  firstRowHeight: computed(
    'rowHeight',
    'atmWorkflowExecutionSummaries._start',
    function firstRowHeight() {
      const _start = this.get('atmWorkflowExecutionSummaries._start');
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
   * @type {ComputedProperty<ReplacingChunksArray<Models.AtmWorkflowExecutionSummary>>}
   */
  atmWorkflowExecutionSummaries: computed('phase', function atmWorkflowExecutionSummaries() {
    const phase = this.get('phase');
    return ReplacingChunksArray.create({
      fetch: this.fetchAtmWorkflowExecutionSummaries.bind(this),
      getIndex(record) {
        return atmWorkflowExecutionSummaryIndex(record, phase);
      },
      startIndex: 0,
      endIndex: 50,
      indexMargin: 10,
    });
  }),

  init() {
    this._super(...arguments);

    const updater = Looper.create({
      immediate: false,
      interval: this.get('updateInterval'),
    });
    updater.on('tick', () => this.updateAtmWorkflowExecutionSummaries());
    this.set('updater', updater);
  },

  didInsertElement() {
    this._super(...arguments);

    this.set('listWatcher', this.createListWatcher());
    this.get('atmWorkflowExecutionSummaries.initialLoad').then(() => {
      next(() => {
        this.get('listWatcher').scrollHandler();
      });
    });
  },

  willDestroyElement() {
    try {
      const {
        updater,
        listWatcher,
      } = this.getProperties('updater', 'listWatcher');
      listWatcher.destroy();
      updater && updater.destroy();
    } finally {
      this._super(...arguments);
    }
  },

  async fetchAtmWorkflowExecutionSummaries() {
    const {
      workflowManager,
      space,
      phase,
    } = this.getProperties('workflowManager', 'space', 'phase');
    return await workflowManager.getAtmWorkflowExecutionSummariesForSpace(
      space,
      phase,
      ...arguments,
    );
  },

  createListWatcher() {
    return new ListWatcher(
      $('#content-scroll'),
      '.data-row',
      items => safeExec(this, 'onTableScroll', items)
    );
  },

  async updateAtmWorkflowExecutionSummaries() {
    await this.get('atmWorkflowExecutionSummaries').scheduleReload();
  },

  /**
   * @param {Array<HTMLElement>} items
   */
  onTableScroll(items) {
    const {
      atmWorkflowExecutionSummaries,
      listWatcher,
    } = this.getProperties(
      'atmWorkflowExecutionSummaries',
      'listWatcher',
    );
    const sourceArray = get(atmWorkflowExecutionSummaries, 'sourceArray');

    if (isEmpty(items) && !isEmpty(sourceArray)) {
      atmWorkflowExecutionSummaries.setProperties({ startIndex: 0, endIndex: 50 });
      return;
    }

    const atmWorkflowExecutionSummariesIds = sourceArray.mapBy('entityId');
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
        element,
      } = this.getProperties('_window', 'rowHeight', 'element');
      const $firstRow = $(element).find('.first-row');
      const firstRowTop = $firstRow.offset().top;
      const blankStart = firstRowTop * -1;
      const blankEnd = blankStart + _window.innerHeight;
      startIndex = firstRowTop < 0 ? Math.floor(blankStart / rowHeight) : 0;
      endIndex = Math.max(Math.floor(blankEnd / rowHeight), 0);
    } else {
      startIndex = atmWorkflowExecutionSummariesIds.indexOf(firstId);
      endIndex = atmWorkflowExecutionSummariesIds.indexOf(lastId, startIndex);
    }

    atmWorkflowExecutionSummaries.setProperties({ startIndex, endIndex });

    next(() => {
      const isBackwardLoading = startIndex > 0 &&
        get(atmWorkflowExecutionSummaries, 'firstObject.id') === firstId;
      if (isBackwardLoading) {
        listWatcher.scrollHandler();
      }
    });
  },

  actions: {
    /**
     * @param {Models.atmWorkflowExecutionSummary}
     * @param {AtmWorkflowExecutionLifecycleChangingOperation} lifecycleChangingOperation
     * @returns {void}
     */
    atmWorkflowExecutionLifecycleChanged(
      atmWorkflowExecutionSummary,
      lifecycleChangingOperation
    ) {
      this.updateAtmWorkflowExecutionSummaries();
      this.onAtmWorkflowExecutionLifecycleChange?.(
        atmWorkflowExecutionSummary,
        lifecycleChangingOperation
      );
    },
  },
});
