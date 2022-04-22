import EmberObject, {
  get,
  getProperties,
  setProperties,
  observer,
} from '@ember/object';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { next } from '@ember/runloop';
import ListWatcher from 'onedata-gui-common/utils/list-watcher';
import $ from 'jquery';

export default EmberObject.extend({
  /**
   * @virtual
   * @type {ReplacingChunksArray}
   */
  entries: undefined,

  /**
   * @virtual
   * @type {InfiniteScrollListFirstRow}
   */
  firstRow: undefined,

  /**
   * @virtual
   * @type {HTMLElement}
   */
  element: undefined,

  /**
   * @virtual
   * @type {() => void}
   */
  onScrolledTop: undefined,

  /**
   * @type {Window}
   */
  _window: window,

  fallbackEndIndex: 50,

  //#region state

  tableTopVisible: true,

  /**
   * @type {Utils.ListWatcher}
   */
  listWatcher: undefined,

  //#endregion

  /**
   * @param {Array<HTMLElement>} items
   * @param {boolean} headerVisible
   */
  onTableScroll(items, headerVisible) {
    const {
      _window,
      element,
      fallbackEndIndex,
      entries,
      firstRow,
      onScrolledTop,
    } = this.getProperties(
      '_window',
      'element',
      'fallbackEndIndex',
      'entries',
      'firstRow',
      'onScrolledTop',
    );
    const sourceArray = this.get('entries.sourceArray');
    const entriesIds = sourceArray.mapBy('id');
    const firstNonEmptyRow = items.find(elem => elem.getAttribute('data-row-id'));
    const firstId =
      firstNonEmptyRow && firstNonEmptyRow.getAttribute('data-row-id') || null;
    const lastId = items[items.length - 1] &&
      items[items.length - 1].getAttribute('data-row-id') || null;

    let startIndex;
    let endIndex;
    if (firstId === null && get(sourceArray, 'length') !== 0) {
      const rowHeight = get(firstRow, 'singleRowHeight');
      const $firstRow = $(element.querySelector('.first-row'));
      const firstRowTop = $firstRow.offset().top;
      const blankStart = firstRowTop * -1;
      const blankEnd = blankStart + _window.innerHeight;
      startIndex = firstRowTop < 0 ?
        Math.floor(blankStart / rowHeight) : 0;
      endIndex = Math.floor(blankEnd / rowHeight);
      if (endIndex < 0) {
        endIndex = fallbackEndIndex;
      }
    } else {
      startIndex = entriesIds.indexOf(firstId);
      endIndex = entriesIds.indexOf(lastId, startIndex);
    }

    const {
      startIndex: oldStartIndex,
      endIndex: oldEndIndex,
    } = getProperties(entries, 'startIndex', 'endIndex');
    if (oldStartIndex !== startIndex || oldEndIndex !== endIndex) {
      setProperties(entries, { startIndex, endIndex });
    }
    safeExec(this, 'set', 'tableTopVisible', headerVisible);
    if (headerVisible && onScrolledTop) {
      onScrolledTop();
    }
  },

  entriesLoadedObserver: observer(
    'entries.isLoaded',
    function entriesLoadedObserver() {
      if (!this.get('entries.isLoaded')) {
        return;
      }

      this.tryDestroyListWatcher();
      next(() => safeExec(this, () => {
        const listWatcher = this.set('listWatcher', this.createListWatcher());
        listWatcher.scrollHandler();
      }));
    }
  ),

  init() {
    this._super(...arguments);
    this.entriesLoadedObserver();
  },

  /**
   * @override
   */
  destroy() {
    try {
      this.tryDestroyListWatcher();
    } finally {
      this._super(...arguments);
    }
  },

  createListWatcher() {
    const element = this.get('element');
    return new ListWatcher(
      $(element.closest('.ps')),
      '.data-row',
      (items, headerVisible) => {
        // FIXME: custom for global-modal
        // if (element.closest('.global-modal').matches('.in')) {
        return safeExec(this, 'onTableScroll', items, headerVisible);
        // }
      },
      '.table-start-row'
    );
  },

  tryDestroyListWatcher() {
    const listWatcher = this.get('listWatcher');
    if (listWatcher) {
      listWatcher.destroy();
    }
  },
});
