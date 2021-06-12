import Component from '@ember/component';
import { computed, get } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import ReplacingChunksArray from 'onedata-gui-common/utils/replacing-chunks-array';
import atmWorkflowExecutionIndex from 'oneprovider-gui/utils/atm-workflow-execution-index';
import Looper from 'onedata-gui-common/utils/looper';
import { next } from '@ember/runloop';
import ListWatcher from 'onedata-gui-common/utils/list-watcher';
import $ from 'jquery';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { isEmpty } from '@ember/utils';
import { htmlSafe } from '@ember/string';

const updateInterval = 5000;

export default Component.extend(I18n, {
  classNames: ['atm-workflow-executions-table'],

  i18n: service(),
  workflowManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceAutomation.atmWorkflowExecutionsTable',

  /**
   * One of: `'waiting'`, `'ongoing'`, `'ended'`
   * @virtual
   * @type {String}
   */
  phase: undefined,

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @type {Number}
   */
  rowHeight: 61,

  /**
   * @type {Utils.Looper}
   */
  updater: undefined,

  /**
   * @type {Window}
   */
  _window: window,

  /**
   * @type {ComputedProperty<Array<String>>}
   */
  columns: computed('phase', function columns() {
    switch (this.get('phase')) {
      case 'waiting':
        return [
          'name',
          'scheduledAt',
          'status',
        ];
      case 'ongoing':
        return [
          'name',
          'startedAt',
          'status',
        ];
      case 'ended':
        return [
          'name',
          'startedAt',
          'finishedAt',
          'status',
        ];
    }
  }),

  firstRowHeight: computed(
    'rowHeight',
    'atmWorkflowExecutions._start',
    function firstRowHeight() {
      const _start = this.get('atmWorkflowExecutions._start');
      return _start ? _start * this.get('rowHeight') : 0;
    }
  ),

  firstRowStyle: computed('firstRowHeight', function firstRowStyle() {
    return htmlSafe(`height: ${this.get('firstRowHeight')}px;`);
  }),

  /**
   * @type {ComputedProperty<ReplacingChunksArray<Models.AtmWorkfloeExecution>>}
   */
  atmWorkflowExecutions: computed('phase', function atmWorkflowExecutions() {
    const phase = this.get('phase');
    return ReplacingChunksArray.create({
      fetch: this.fetchAtmWorkflowExecutions.bind(this),
      getIndex(record) {
        return atmWorkflowExecutionIndex(record, phase);
      },
      startIndex: 0,
      endIndex: 20,
      indexMargin: 10,
    });
  }),

  init() {
    this._super(...arguments);

    if (this.get('phase') !== 'ended') {
      const updater = Looper.create({
        immediate: false,
        interval: updateInterval,
      });
      updater.on('tick', () => this.updateAtmWorkflowExecutions());
      this.set('updater', updater);
    }
  },

  didInsertElement() {
    this._super(...arguments);

    this.set('listWatcher', this.createListWatcher());
    this.get('atmWorkflowExecutions.initialLoad').then(() => {
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

  async fetchAtmWorkflowExecutions() {
    const {
      workflowManager,
      space,
      phase,
    } = this.getProperties('workflowManager', 'space', 'phase');
    return await workflowManager.getAtmWorkflowExecutionsForSpace(
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

  async updateAtmWorkflowExecutions() {
    await this.get('atmWorkflowExecutions').reload();
  },

  /**
   * @param {Array<HTMLElement>} items
   */
  onTableScroll(items) {
    const {
      atmWorkflowExecutions,
      listWatcher,
    } = this.getProperties(
      'atmWorkflowExecutions',
      'listWatcher',
    );
    const sourceArray = get(atmWorkflowExecutions, 'sourceArray');

    if (isEmpty(items) && !isEmpty(sourceArray)) {
      atmWorkflowExecutions.setProperties({ startIndex: 0, endIndex: 50 });
      return;
    }

    const atmWorkflowExecutionsIds = sourceArray.mapBy('entityId');
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
      const $firstRow = $('.first-row');
      const firstRowTop = $firstRow.offset().top;
      const blankStart = firstRowTop * -1;
      const blankEnd = blankStart + _window.innerHeight;
      startIndex = firstRowTop < 0 ? Math.floor(blankStart / rowHeight) : 0;
      endIndex = Math.max(Math.floor(blankEnd / rowHeight), 0);
    } else {
      startIndex = atmWorkflowExecutionsIds.indexOf(firstId);
      endIndex = atmWorkflowExecutionsIds.indexOf(lastId, startIndex);
    }

    atmWorkflowExecutions.setProperties({ startIndex, endIndex });

    next(() => {
      const isBackwardLoading = startIndex > 0 &&
        get(atmWorkflowExecutions, 'firstObject.id') === firstId;
      if (isBackwardLoading) {
        listWatcher.scrollHandler();
      }
    });
  },
});
