/**
 * A container with table of files (children of selected dir).
 * Supports infinite scroll.
 * 
 * @module components/file-browser/fb-table
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { get, computed, observer } from '@ember/object';
import isPopoverOpened from 'onedata-gui-common/utils/is-popover-opened';
import { reads } from '@ember/object/computed';
import $ from 'jquery';
import ReplacingChunksArray from 'onedata-gui-common/utils/replacing-chunks-array';
import { inject as service } from '@ember/service';
import ListWatcher from 'onedata-gui-common/utils/list-watcher';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { htmlSafe } from '@ember/string';
import { scheduleOnce } from '@ember/runloop';
import createPropertyComparator from 'onedata-gui-common/utils/create-property-comparator';
import { getButtonActions } from 'oneprovider-gui/components/file-browser';

const compareIndex = createPropertyComparator('index');

export default Component.extend(I18n, {
  classNames: ['fb-table'],

  fileServer: service(),
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbTable',

  /**
   * @virtual
   * @type {models/File}
   */
  dir: undefined,

  /**
   * @virtual
   * @type {string}
   */
  selectionContext: undefined,

  /**
   * @virtual
   * @type {Array<models/File>}
   */
  selectedFiles: undefined,

  changeDir: undefined,

  downloadFile: undefined,

  _window: window,

  /**
   * @type {models/File}
   */
  lastSelectedFile: undefined,

  rowHeight: 61,

  /**
   * @type {boolean}
   */
  headerVisible: undefined,

  selectionCount: reads('selectedFiles.length'),

  firstRowHeight: computed(
    'rowHeight',
    'filesArray._start',
    function firstRowHeight() {
      const _start = this.get('filesArray._start');
      return _start ? _start * this.get('rowHeight') : 0;
    }
  ),

  firstRowStyle: computed('firstRowHeight', function firstRowStyle() {
    return htmlSafe(`height: ${this.get('firstRowHeight')}px;`);
  }),

  filesArray: computed('dir.entityId', function filesArray() {
    const dirId = this.get('dir.entityId');
    return ReplacingChunksArray.create({
      fetch: (...fetchArgs) => this.fetchDirChildren(dirId, ...fetchArgs),
      sortFun: compareIndex,
      startIndex: 0,
      endIndex: 50,
      indexMargin: 10,
    });
  }),

  visibleFiles: reads('filesArray'),

  contextMenuButtons: computed(
    'selectionContext',
    'selectionCount',
    function contextMenuButtons() {
      const {
        allButtonsArray,
        selectionContext,
        selectionCount,
      } = this.getProperties(
        'allButtonsArray',
        'selectionContext',
        'selectionCount'
      );
      return [
        { separator: true, title: this.t('menuSelection', { selectionCount }) },
        ...getButtonActions(allButtonsArray, selectionContext),
      ];
    }
  ),

  watchFilesArrayInitialLoad: observer(
    'filesArray.initialLoad.isFulfilled',
    function watchFilesArrayInitialLoad() {
      const listWatcher = this.get('listWatcher');
      scheduleOnce('afterRender', () => {
        listWatcher.scrollHandler();
      });
    }
  ),

  init() {
    this._super(...arguments);
    this.get('fileServer').on('dirChildrenRefresh', parentDir => {
      if (this.get('dir') === parentDir) {
        const filesArray = this.get('filesArray');
        filesArray.reload({
          head: true,
          minSize: 50,
        }).then(() => filesArray.reload());
        // FIXME: more efficient, but buggy way
        // filesArray.reload({
        //   offset: -1,
        //   minSize: 50,
        // });
      }
    });
  },

  didInsertElement() {
    this._super(...arguments);
    const listWatcher = this.set('listWatcher', this.createListWatcher());
    listWatcher.scrollHandler();
  },

  willDestroyElement() {
    try {
      this.get('listWatcher').destroy();
    } finally {
      this._super(...arguments);
    }
  },

  onTableScroll(items, headerVisible) {
    const filesArray = this.get('filesArray');
    const sourceArray = get(filesArray, 'sourceArray');
    const filesArrayIds = sourceArray.mapBy('entityId');
    const firstId = items[0] && items[0].getAttribute('data-row-id') || null;
    const lastId = items[items.length - 1] &&
      items[items.length - 1].getAttribute('data-row-id') || null;
    let startIndex, endIndex;
    if (firstId === null && get(sourceArray, 'length') !== 0) {
      const rowHeight = this.get('rowHeight');
      const $firstRow = $('.first-row');
      const firstRowTop = $firstRow.offset().top;
      const blankStart = firstRowTop * -1;
      const blankEnd = blankStart + window.innerHeight;
      startIndex = firstRowTop < 0 ? Math.floor(blankStart / rowHeight) : 0;
      endIndex = Math.floor(blankEnd / rowHeight);
    } else {
      startIndex = filesArrayIds.indexOf(firstId);
      endIndex = filesArrayIds.indexOf(lastId, startIndex);
    }
    filesArray.setProperties({ startIndex, endIndex });
    safeExec(this, 'set', 'headerVisible', headerVisible);
  },

  createListWatcher() {
    return new ListWatcher(
      $('.embedded-content'),
      '.data-row',
      (items, onTop) => safeExec(this, 'onTableScroll', items, onTop),
      '.table-start-row',
    );
  },

  fetchDirChildren(dirId, ...fetchArgs) {
    return this.get('fileServer').fetchDirChildren(dirId, ...fetchArgs);
  },

  clearFilesSelection() {
    this.get('selectedFiles').clear();
  },

  /**
   * Do something if user clicks on a file. Consider modifier keys
   * @param {object} file
   * @param {boolean} ctrlKey
   * @param {boolean} shiftKey
   * @returns {undefined}
   */
  fileClicked(file, ctrlKey, shiftKey) {
    console.log('FIXME: clicked');

    // do not change selection if only clicking to close context menu
    if (isPopoverOpened()) {
      return;
    }

    /** @type {Array<object>} */
    const selectedFiles = this.get('selectedFiles');
    const selectedCount = get(selectedFiles, 'length');
    const fileIsSelected = selectedFiles.includes(file);
    const otherFilesSelected = selectedCount > (fileIsSelected ? 1 : 0);
    if (otherFilesSelected) {
      if (fileIsSelected) {
        if (ctrlKey) {
          this.selectRemoveSingleFile(selectedFiles, file);
        } else {
          this.selectOnlySingleFile(selectedFiles, file);
        }
      } else {
        if (ctrlKey) {
          this.selectAddSingleFile(selectedFiles, file);
        } else {
          if (shiftKey) {
            this.selectRangeToFile(file);
          } else {
            this.selectOnlySingleFile(selectedFiles, file);
          }
        }
      }
    } else {
      if (fileIsSelected) {
        this.selectRemoveSingleFile(selectedFiles, file);
      } else {
        this.selectAddSingleFile(selectedFiles, file);
      }
    }
  },

  selectRemoveSingleFile(selectedFiles, file) {
    selectedFiles.removeObject(file);
    this.set('lastSelectedFile', null);
  },

  selectAddSingleFile(selectedFiles, file) {
    selectedFiles.pushObject(file);
    this.set('lastSelectedFile', file);
  },

  selectOnlySingleFile(selectedFiles, file) {
    this.clearFilesSelection(selectedFiles, file);
    this.selectAddSingleFile(selectedFiles, file);
  },

  /**
   * Select files range using shift.
   * Use nearest selected file as range start.
   * @param {File} file
   * @returns {undefined}
   */
  selectRangeToFile(file) {
    const {
      filesArray,
      selectedFiles,
      lastSelectedFile,
    } = this.getProperties(
      'filesArray',
      'selectedFiles',
      'lastSelectedFile'
    );

    const sourceArray = get(filesArray, 'sourceArray');

    const fileIndex = sourceArray.indexOf(file);

    let startIndex;
    if (lastSelectedFile) {
      startIndex = sourceArray.indexOf(lastSelectedFile);
    } else {
      startIndex = this.findNearestSelectedIndex(fileIndex);
    }

    const indexA = Math.min(startIndex, fileIndex);
    const indexB = Math.max(startIndex, fileIndex);
    selectedFiles.addObjects(sourceArray.slice(indexA, indexB + 1));
  },

  findNearestSelectedIndex(fileIndex) {
    const {
      visibleFiles,
      selectedFiles,
    } = this.getProperties(
      'visibleFiles',
      'selectedFiles'
    );

    // Array<[index: Number, distanceFromFile: Number]>
    const selectedFilesIndices = selectedFiles.map(sf => {
      const index = visibleFiles.indexOf(sf);
      return [index, Math.abs(index - fileIndex)];
    });
    const nearest = selectedFilesIndices.reduce((prev, current) => {
      return current[1] < prev[1] ? current : prev;
    }, [-1, Infinity]);
    let [nearestIndex, nearestDist] = nearest;
    if (nearestDist === Infinity) {
      nearestIndex = fileIndex;
    }
    return nearestIndex;
  },

  actions: {
    openContextMenu(file, mouseEvent) {
      const selectedFiles = this.get('selectedFiles');
      if (get(selectedFiles, 'length') === 0 || !selectedFiles.includes(file)) {
        this.selectOnlySingleFile(selectedFiles, file);
      }
      let left;
      let top;
      const trigger = mouseEvent.currentTarget;
      if (trigger.matches('.one-menu-toggle')) {
        const $trigger = $(trigger);
        const toggleOffset = $trigger.offset();
        left = toggleOffset.left + trigger.clientWidth / 2;
        top = toggleOffset.top + trigger.clientHeight / 2;
      } else {
        left = mouseEvent.clientX;
        top = mouseEvent.clientY;
      }
      const $this = this.$();
      const tableOffset = $this.offset();
      left = left - tableOffset.left + this.element.offsetLeft;
      top = top - tableOffset.top + this.element.offsetTop;
      this.$('.file-actions-trigger').css({
        top,
        left,
      });
      // cause popover refresh
      if (this.get('fileActionsOpen')) {
        window.dispatchEvent(new Event('resize'));
      }
      this.actions.toggleFileActions.bind(this)(true, file);
    },
    toggleFileActions(open, file) {
      this.set('fileActionsOpen', open, file);
    },

    /**
     * @param {object} file 
     * @param {MouseEvent} clickEvent
     * @returns {any} result of this.fileClicked
     */
    fileClicked(file, clickEvent) {
      console.log('FIXME: file single clicked: ' + get(file, 'name'));
      const { ctrlKey, metaKey, shiftKey } = clickEvent;
      return this.fileClicked(
        file,
        ctrlKey || metaKey,
        shiftKey
      );
    },

    fileDoubleClicked(file /*, clickEvent */ ) {
      console.log('FIXME: file double clicked');
      const isDir = get(file, 'type') === 'dir';
      if (isDir) {
        console.log('FIXME: send changeDir');
        this.get('changeDir')(file);
      } else {
        this.get('fileServer').download(get(file, 'entityId'));
      }
    },
  },
});
