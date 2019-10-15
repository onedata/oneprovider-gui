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
import { htmlSafe, camelize } from '@ember/string';
import { scheduleOnce } from '@ember/runloop';
import createPropertyComparator from 'onedata-gui-common/utils/create-property-comparator';
import { getButtonActions } from 'oneprovider-gui/components/file-browser';
import { equal, and, not, or } from 'ember-awesome-macros';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { next, later } from '@ember/runloop';
import { resolve } from 'rsvp';

const compareIndex = createPropertyComparator('index');

export default Component.extend(I18n, {
  classNames: ['fb-table'],
  classNameBindings: [
    'hasEmptyDirClass:empty-dir',
    'dirLoadError:error-dir',
    'specialViewClass:special-dir-view',
  ],

  fileManager: service(),
  i18n: service(),
  globalNotify: service(),
  errorExtractor: service(),
  isMobile: service(),

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

  /**
   * @virtual
   * @type {Array<Object>}
   */
  allButtonsArray: undefined,

  /**
   * @virtual optional
   * @type {Function} (boolean) => any
   */
  hasEmptyDirClassChanged: notImplementedIgnore,

  changeDir: undefined,

  _window: window,

  /**
   * @type {models/File}
   */
  lastSelectedFile: undefined,

  rowHeight: 61,

  fetchingPrev: false,

  fetchingNext: false,

  /**
   * @type {boolean}
   */
  headerVisible: undefined,

  selectionCount: reads('selectedFiles.length'),

  fileClipboardMode: reads('fileManager.fileClipboardMode'),

  fileClipboardFiles: reads('fileManager.fileClipboardFiles'),

  // NOTE: not using reads as a workaround to bug in Ember 2.18
  initialLoad: computed('filesArray.initialLoad', function initialLoad() {
    return this.get('filesArray.initialLoad');
  }),

  /**
   * True if there is initially loaded file list, but it is empty.
   * False if there is initially loaded file list, but it is not empty.
   * Undefined if the file list is not yet loaded.
   * @type {boolean|undefined}
   */
  isDirEmpty: and('initialLoad.isFulfilled', not('filesArray.length')),

  /**
   * If true, the `empty-dir` class should be added
   * @type {ComputedProperty<boolean>}
   */
  hasEmptyDirClass: and(
    equal('isDirEmpty', true),
    equal('dirLoadError', undefined),
  ),

  /**
   * @type {ComputedProperty<boolean>}
   */
  showDirContextMenu: not('dirLoadError'),

  specialViewClass: or('hasEmptyDirClass', 'dirLoadError'),

  /**
   * @type {ComputedProperty<object>}
   */
  dirLoadError: computed(
    'initialLoad.{isRejected,reason}',
    function dirLoadError() {
      const initialLoad = this.get('initialLoad');
      if (get(initialLoad, 'isRejected')) {
        const reason = get(initialLoad, 'reason');
        if (reason) {
          return this.get('errorExtractor').getMessage(reason) ||
            this.t('unknownError');
        } else {
          return this.t('uknownError');
        }
      }
    }
  ),

  uploadAction: computed('allButtonsArray.[]', function uploadAction() {
    return this.get('allButtonsArray').findBy('id', 'upload');
  }),

  newDirectoryAction: computed('allButtonsArray.[]', function newDirectoryAction() {
    return this.get('allButtonsArray').findBy('id', 'newDirectory');
  }),

  pasteAction: computed('allButtonsArray.[]', function pasteAction() {
    return this.get('allButtonsArray').findBy('id', 'paste');
  }),

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
    const array = ReplacingChunksArray.create({
      fetch: (...fetchArgs) => this.fetchDirChildren(dirId, ...fetchArgs),
      sortFun: compareIndex,
      startIndex: 0,
      endIndex: 50,
      indexMargin: 10,
    });
    array.on(
      'fetchPrevStarted',
      () => this.stateOfFetchUpdate('prev', 'started')
    );
    array.on(
      'fetchPrevResolved',
      () => this.stateOfFetchUpdate('prev', 'resolved')
    );
    array.on(
      'fetchPrevRejected',
      () => this.stateOfFetchUpdate('prev', 'rejected')
    );
    array.on(
      'fetchNextStarted',
      () => this.stateOfFetchUpdate('next', 'started')
    );
    array.on(
      'fetchNextResolved',
      () => this.stateOfFetchUpdate('next', 'resolved')
    );
    array.on(
      'fetchNextRejected',
      () => this.stateOfFetchUpdate('next', 'rejected')
    );
    return array;
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
    'initialLoad.isFulfilled',
    function watchFilesArrayInitialLoad() {
      if (this.get('initialLoad.isFulfilled')) {
        const listWatcher = this.get('listWatcher');
        scheduleOnce('afterRender', () => {
          listWatcher.scrollHandler();
        });
      }
    }
  ),

  init() {
    this._super(...arguments);
    this.get('fileManager').registerRefreshHandler(this);
  },

  didInsertElement() {
    this._super(...arguments);
    const listWatcher = this.set('listWatcher', this.createListWatcher());
    listWatcher.scrollHandler();
  },

  willDestroyElement() {
    try {
      this.get('listWatcher').destroy();
      this.get('fileManager').deregisterRefreshHandler(this);
    } finally {
      this._super(...arguments);
    }
  },

  /**
   * @param {string} type one of: prev, next
   * @param {string} state one of: started, resolved, rejected
   * @returns {undefined}
   */
  stateOfFetchUpdate(type, state) {
    safeExec(
      this,
      'set',
      camelize(`fetching-${type}`),
      state === 'started'
    );
  },

  onDirChildrenRefresh(parentDirEntityId) {
    if (this.get('dir.entityId') === parentDirEntityId) {
      return this.refreshFileList();
    } else {
      return resolve();
    }
  },

  refreshFileList() {
    return this.get('filesArray').reload();
  },

  onTableScroll(items, headerVisible) {
    const filesArray = this.get('filesArray');
    const sourceArray = get(filesArray, 'sourceArray');
    const filesArrayIds = sourceArray.mapBy('entityId');

    if (items[0] && !items[0].getAttribute('data-row-id')) {
      const listWatcher = this.get('listWatcher');
      next(() => {
        filesArray.fetchPrev().then(() => listWatcher.scrollHandler());
      });
    }

    const firstNonEmptyRow = items.find(elem => elem.getAttribute('data-row-id'));
    const firstId =
      firstNonEmptyRow && firstNonEmptyRow.getAttribute('data-row-id') || null;
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
      if (endIndex < 0) {
        endIndex = 50;
      }
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
    return this.get('fileManager').fetchDirChildren(dirId, ...fetchArgs);
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

  downloadUsingIframe(fileUrl) {
    const iframe = $('<iframe/>').attr({
      src: fileUrl,
      style: 'visibility:hidden;display:none',
    }).appendTo($('body'));
    // the time should be long to support some download extensions in Firefox desktop
    later(() => iframe.remove(), 60000);
  },

  downloadUsingOpen(fileUrl) {
    // Apple devices such as iPad tries to open file using its embedded viewer
    // in any browser, but we cannot say if the file extension is currently supported
    // so we try to open every file in new tab.
    const target = this.get('isMobile.apple.device') ? '_blank' : '_self';
    window.open(fileUrl, target);
  },

  openFile(file) {
    const isDir = get(file, 'type') === 'dir';
    if (isDir) {
      return this.get('changeDir')(file);
    } else {
      return this.downloadFile(get(file, 'entityId'));
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

  downloadFile(fileEntityId) {
    const {
      fileManager,
      globalNotify,
      isMobile,
    } = this.getProperties('fileManager', 'globalNotify', 'isMobile');
    const isMobileBrowser = get(isMobile, 'any');
    return fileManager.getFileDownloadUrl(fileEntityId)
      .then((data) => {
        const fileUrl = data && get(data, 'fileUrl');
        if (fileUrl) {
          if (isMobileBrowser) {
            this.downloadUsingOpen(fileUrl);
          } else {
            this.downloadUsingIframe(fileUrl);
          }
        } else {
          throw { isOnedataCustomError: true, type: 'empty-file-url' };
        }
      })
      .catch((error) => {
        globalNotify.backendError(this.t('startingDownload'), error);
        throw error;
      });
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
        const $middleDot = $(trigger).find('.icon-dot').eq(1);
        const middleDotOffset = $middleDot.offset();
        left = middleDotOffset.left + 1;
        top = middleDotOffset.top + 1;
      } else {
        left = mouseEvent.clientX;
        top = mouseEvent.clientY;
      }
      const $this = this.$();
      const tableOffset = $this.offset();
      left = left - tableOffset.left;
      top = top - tableOffset.top;
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
      const { ctrlKey, metaKey, shiftKey } = clickEvent;
      return this.fileClicked(
        file,
        ctrlKey || metaKey,
        shiftKey
      );
    },

    /**
     * @param {object} file
     * @param {TouchEvent} touchEvent
     * @returns {any}
     */
    fileTouchHeld(file /*, touchEvent */ ) {
      return this.fileClicked(file, true, false);
    },

    /**
     * @param {object} file
     * @returns {any}
     */
    fileTapped(file) {
      const areSomeFilesSelected = Boolean(this.get('selectedFiles.length'));
      if (areSomeFilesSelected) {
        return this.fileClicked(file, true, false);
      } else {
        return this.openFile(file);
      }
    },

    fileDoubleClicked(file /*, clickEvent */ ) {
      return this.openFile(file);
    },

    emptyDirUpload() {
      return this.get('uploadAction.action')(...arguments);
    },

    emptyDirNewDirectory() {
      return this.get('newDirectoryAction.action')(...arguments);
    },

    emptyDirPaste() {
      return this.get('pasteAction.action')(...arguments);
    },
  },
});
