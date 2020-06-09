/**
 * A container with table of files (children of selected dir).
 * Supports infinite scroll.
 * 
 * @module components/file-browser/fb-table
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { get, computed, observer, setProperties } from '@ember/object';
import isPopoverOpened from 'onedata-gui-common/utils/is-popover-opened';
import { reads } from '@ember/object/computed';
import $ from 'jquery';
import ReplacingChunksArray from 'onedata-gui-common/utils/replacing-chunks-array';
import { inject as service } from '@ember/service';
import ListWatcher from 'onedata-gui-common/utils/list-watcher';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { htmlSafe, camelize } from '@ember/string';
import { scheduleOnce } from '@ember/runloop';
import { getButtonActions } from 'oneprovider-gui/components/file-browser';
import { equal, and, not, or, array, raw } from 'ember-awesome-macros';
import { next, later } from '@ember/runloop';
import { resolve, Promise } from 'rsvp';
import _ from 'lodash';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import ViewTester from 'onedata-gui-common/utils/view-tester';

export default Component.extend(I18n, {
  classNames: ['fb-table'],
  classNameBindings: [
    'hasEmptyDirClass:empty-dir',
    'dirLoadError:error-dir',
    'specialViewClass:special-dir-view',
    'refreshStarted',
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
   * @virtual
   * @type {string}
   */
  fileClipboardMode: undefined,

  /**
   * @virtual
   * @type {Array<Models.File>}
   */
  fileClipboardFiles: undefined,

  /**
   * @virtual optional
   * @type {(api: { refresh: Function }) => undefined}
   */
  registerApi: notImplementedIgnore,

  /**
   * @virtual optional
   * If defined replace `fetchDirChildren` with this function
   * @type {Function}
   */
  customFetchDirChildren: undefined,

  /**
   * @virtual
   * @type {boolean}
   */
  previewMode: false,

  /**
   * @type {Boolean}
   */
  renderRefreshSpinner: false,

  changeDir: undefined,

  _window: window,

  /**
   * @type {HTMLElement}
   */
  _body: document.body,

  /**
   * JS time when context menu was last repositioned
   * @type {Number}
   */
  contextMenuRepositionTime: 1,

  /**
   * Set by `one-webui-popover.registerApi` in HBS.
   * Undefined if not rendering context menu.
   * @type {Object} API of `one-webui-popover`
   */
  contextMenuApi: undefined,

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

  /**
   * @type {models/File}
   */
  downloadModalFile: null,

  selectionCount: reads('selectedFiles.length'),

  /**
   * @type {ComputedProperty<Array<String>>}
   */
  conflictNames: computed('filesArray.sourceArray.@each.index', function conflictNames() {
    const namesCount = _.countBy(
      this.get('filesArray.sourceArray').mapBy('index'),
      name => name,
    );
    const test = Object.entries(namesCount)
      .filter(([, count]) => count > 1)
      .map(([name]) => name);
    return test;
  }),

  // NOTE: not using reads as a workaround to bug in Ember 2.18
  initialLoad: computed('filesArray.initialLoad', function initialLoad() {
    return this.get('filesArray.initialLoad');
  }),

  /**
   * True if there is initially loaded file list, but it is empty.
   * False if there is initially loaded file list, but it is not empty or
   * the list was not yet loaded or cannot be loaded.
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
        return get(initialLoad, 'reason');
      }
    }
  ),

  /**
   * If the error is POSIX, returns string posix error code
   * @type {ComputedProperty<string|undefined>}
   */
  dirLoadErrorPosix: computed(
    'dirLoadError.{id,details.errno}',
    function dirLoadErrorPosix() {
      const dirLoadError = this.get('dirLoadError');
      if (get(dirLoadError, 'id') === 'posix') {
        return get(dirLoadError, 'details.errno');
      }
    }
  ),

  /**
   * @type {ComputedProperty<object>} message object from error extractor
   */
  dirLoadErrorMessage: computed(
    'dirLoadError',
    function dirLoadErrorMessage() {
      const reason = this.get('dirLoadError');
      if (reason) {
        return this.get('errorExtractor').getMessage(reason) ||
          this.t('unknownError');
      } else {
        return this.t('uknownError');
      }
    }
  ),

  uploadAction: array.findBy('allButtonsArray', raw('id'), raw('upload')),

  newDirectoryAction: array.findBy('allButtonsArray', raw('id'), raw('newDirectory')),

  pasteAction: array.findBy('allButtonsArray', raw('id'), raw('paste')),

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
      fetch: (...fetchArgs) =>
        this.get('fetchDirChildren')(dirId, ...fetchArgs),
      startIndex: 0,
      endIndex: 50,
      indexMargin: 10,
    });
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
    return array;
  }),

  visibleFiles: reads('filesArray'),

  /**
   * Functions exposed by fb-table
   * @type {ComputedProperty<Object>}
   */
  api: computed(function api() {
    return {
      refresh: () => {
        const {
          refreshStarted,
          element,
        } = this.getProperties('refreshStarted', 'element');
        if (refreshStarted) {
          return resolve();
        }
        this.set('renderRefreshSpinner', true);
        // wait for refresh spinner to render because it needs to transition
        return new Promise((resolve, reject) => {
          scheduleOnce('afterRender', () => {
            safeExec(this, 'set', 'refreshStarted', true);
            const animationPromise = new Promise((resolve) => {
              element.addEventListener(
                'transitionend',
                (event) => {
                  if (event.propertyName === 'opacity') {
                    resolve();
                  }
                }, { once: true }
              );
            });
            this.refreshFileList()
              .finally(() => {
                animationPromise.finally(() => {
                  safeExec(this, 'set', 'refreshStarted', false);
                  later(() => {
                    if (!this.get('refreshStarted')) {
                      safeExec(this, 'set', 'renderRefreshSpinner', false);
                    }
                  }, 300);
                });
              })
              .then(resolve, reject);
          });
        });
      },
    };
  }),

  contextMenuButtons: computed(
    'allButtonsArray',
    'selectionContext',
    'selectionCount',
    'previewMode',
    function contextMenuButtons() {
      const {
        allButtonsArray,
        selectionContext,
        selectionCount,
        previewMode,
      } = this.getProperties(
        'allButtonsArray',
        'selectionContext',
        'selectionCount',
        'previewMode'
      );
      const menuItems = previewMode ? [] : [{
        separator: true,
        title: this.t(
          'menuSelection', { selectionCount }),
      }];
      return menuItems.concat(getButtonActions(allButtonsArray, selectionContext));
    }
  ),

  fetchDirChildren: computed('customFetchDirChildren', function fetchDirChildren() {
    return this.get('customFetchDirChildren') || this._fetchDirChildren.bind(this);
  }),

  apiObserver: observer('registerApi', 'api', function apiObserver() {
    const {
      registerApi,
      api,
    } = this.getProperties('registerApi', 'api');
    registerApi(api);
  }),

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
    const {
      fileManager,
      registerApi,
      api,
    } = this.getProperties('fileManager', 'registerApi', 'api');
    fileManager.registerRefreshHandler(this);
    registerApi(api);
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
  onFetchingStateUpdate(type, state) {
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
    const filesArray = this.get('filesArray');
    const $contentScroll = $('#content-scroll');
    const viewTester = new ViewTester($contentScroll);
    const visibleLengthBeforeReload = this.$('.data-row').toArray()
      .filter(row => viewTester.isInView(row)).length;

    return filesArray.reload()
      .finally(() => {
        const {
          selectedFiles,
          changeSelectedFiles,
        } = this.getProperties('selectedFiles', 'changeSelectedFiles');
        const sourceArray = get(filesArray, 'sourceArray');
        changeSelectedFiles(selectedFiles.filter(selectedFile =>
          sourceArray.includes(selectedFile)
        ));

        scheduleOnce('afterRender', () => {
          const anyRowVisible = this.$('.data-row').toArray()
            .some(row => viewTester.isInView(row));

          if (!anyRowVisible) {
            const fullLengthAfterReload = get(sourceArray, 'length');
            setProperties(filesArray, {
              startIndex: Math.max(
                0,
                fullLengthAfterReload - Math.max(3, visibleLengthBeforeReload - 10)
              ),
              endIndex: fullLengthAfterReload || 50,
            });
            next(() => {
              const firstRenderedRow = document.querySelector('.data-row[data-row-id]');
              if (firstRenderedRow) {
                firstRenderedRow.scrollIntoView();
              } else {
                $contentScroll.scrollTop(0);
              }
            });
          }
        });
      });
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
    let startIndex;
    let endIndex;
    if (firstId === null && get(sourceArray, 'length') !== 0) {
      const {
        rowHeight,
        _window,
      } = this.getProperties('rowHeight', '_window');
      const $firstRow = $('.first-row');
      const firstRowTop = $firstRow.offset().top;
      const blankStart = firstRowTop * -1;
      const blankEnd = blankStart + _window.innerHeight;
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
      $('#content-scroll'),
      '.data-row',
      (items, onTop) => safeExec(this, 'onTableScroll', items, onTop),
      '.table-start-row',
    );
  },

  _fetchDirChildren(dirId, ...fetchArgs) {
    const {
      fileManager,
      previewMode,
    } = this.getProperties('fileManager', 'previewMode');
    return fileManager
      .fetchDirChildren(dirId, previewMode ? 'public' : 'private', ...fetchArgs);
  },

  clearFilesSelection() {
    this.get('changeSelectedFiles')([]);
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

    const {
      selectedFiles,
      previewMode,
    } = this.getProperties('selectedFiles', 'previewMode');
    const selectedCount = get(selectedFiles, 'length');
    const fileIsSelected = selectedFiles.includes(file);
    const otherFilesSelected = selectedCount > (fileIsSelected ? 1 : 0);
    if (previewMode) {
      if (fileIsSelected) {
        this.selectRemoveSingleFile(file);
      } else {
        this.selectOnlySingleFile(file);
      }
    } else {
      if (otherFilesSelected) {
        if (fileIsSelected) {
          if (ctrlKey) {
            this.selectRemoveSingleFile(file);
          } else {
            this.selectOnlySingleFile(file);
          }
        } else {
          if (ctrlKey) {
            this.selectAddSingleFile(file);
          } else {
            if (shiftKey) {
              this.selectRangeToFile(file);
            } else {
              this.selectOnlySingleFile(file);
            }
          }
        }
      } else {
        if (fileIsSelected) {
          this.selectRemoveSingleFile(file);
        } else {
          this.selectAddSingleFile(file);
        }
      }
    }
  },

  downloadUsingIframe(fileUrl) {
    const _body = this.get('_body');
    const iframe = $('<iframe/>').attr({
      src: fileUrl,
      style: 'display:none;',
    }).appendTo(_body);
    // the time should be long to support some download extensions in Firefox desktop
    later(() => iframe.remove(), 60000);
  },

  downloadUsingOpen(fileUrl) {
    // Apple devices such as iPad tries to open file using its embedded viewer
    // in any browser, but we cannot say if the file extension is currently supported
    // so we try to open every file in new tab.
    const target = this.get('isMobile.apple.device') ? '_blank' : '_self';
    this.get('_window').open(fileUrl, target);
  },

  openFile(file, confirmModal = false) {
    const isDir = get(file, 'type') === 'dir';
    if (isDir) {
      return this.get('changeDir')(file);
    } else {
      if (confirmModal) {
        this.set('downloadModalFile', file);
      } else {
        this.downloadFile(get(file, 'entityId'));
      }
    }
  },

  addToSelectedFiles(newFiles) {
    const {
      selectedFiles,
      changeSelectedFiles,
    } = this.getProperties('selectedFiles', 'changeSelectedFiles');
    const filesWithoutBroken = _.difference(
      newFiles.filter(f => get(f, 'type') !== 'broken'),
      selectedFiles
    );
    const newSelectedFiles = [...selectedFiles, ...filesWithoutBroken];

    return changeSelectedFiles(newSelectedFiles);
  },

  selectRemoveSingleFile(file) {
    const {
      selectedFiles,
      changeSelectedFiles,
    } = this.getProperties('selectedFiles', 'changeSelectedFiles');
    changeSelectedFiles(selectedFiles.without(file));
    this.set('lastSelectedFile', null);
  },

  selectAddSingleFile(file) {
    this.addToSelectedFiles([file]);
    this.set('lastSelectedFile', file);
  },

  selectOnlySingleFile(file) {
    this.get('changeSelectedFiles')([file]);
    this.set('lastSelectedFile', file);
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
      lastSelectedFile,
    } = this.getProperties(
      'filesArray',
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
    this.addToSelectedFiles(sourceArray.slice(indexA, indexB + 1));
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
      previewMode,
    } = this.getProperties('fileManager', 'globalNotify', 'isMobile', 'previewMode');
    const isMobileBrowser = get(isMobile, 'any');
    return fileManager.getFileDownloadUrl(
        fileEntityId,
        previewMode ? 'public' : 'private'
      )
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
        this.selectOnlySingleFile(file);
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
      // opening popover in after rendering trigger position change prevents from bad 
      // placement
      scheduleOnce('afterRender', () => {
        // cause popover refresh
        if (this.get('fileActionsOpen')) {
          this.set('contextMenuRepositionTime', new Date().getTime());
          this.get('contextMenuApi').reposition();
        }
        this.actions.toggleFileActions.bind(this)(true, file);
      });
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
        return this.openFile(file, true);
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

    closeDownloadModal() {
      this.set('downloadModalFile', null);
    },

    confirmDownload() {
      return this.downloadFile(this.get('downloadModalFile.entityId'));
    },
  },
});
