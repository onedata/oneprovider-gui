/**
 * Container for file browser to use in an iframe with injected properties.
 *
 * @module component/content-file-browser
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OneEmbeddedComponent from 'oneprovider-gui/components/one-embedded-component';
import { inject as service } from '@ember/service';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { computed, get, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import { getSpaceIdFromFileId } from 'oneprovider-gui/models/file';
import ContentSpaceBaseMixin from 'oneprovider-gui/mixins/content-space-base';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { promise } from 'ember-awesome-macros';
import { resolve, Promise } from 'rsvp';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import onlyFulfilledValues from 'onedata-gui-common/utils/only-fulfilled-values';
import FilesystemBrowserModel from 'oneprovider-gui/utils/filesystem-browser-model';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';

export default OneEmbeddedComponent.extend(
  I18n,
  ContentSpaceBaseMixin, {
    classNames: ['content-file-browser', 'upload-drop-zone-container'],

    /**
     * @override
     */
    i18nPrefix: 'components.contentFileBrowser',

    store: service(),
    fileManager: service(),
    uploadManager: service(),
    spaceManager: service(),
    globalNotify: service(),

    /**
     * Entity ID of space for which the file browser is rendered.
     * 
     * **Injected from parent frame.**
     * @virtual
     * @type {String}
     */
    spaceEntityId: undefined,

    /**
     * Entity ID of currently opened directory in file browser.
     * 
     * **Injected from parent frame.**
     * @virtual optional
     */
    dirEntityId: undefined,

    /**
     * Array of file IDs that should be selected on file browser init.
     * 
     * **Injected from parent frame.**
     * @virtual optional
     * @type {Array<String>}
     */
    selected: undefined,

    /**
     * @virtual optional
     * @type {Function}
     */
    containerScrollTop: notImplementedIgnore,

    /**
     * @override
     */
    iframeInjectedProperties: Object.freeze([
      'spaceEntityId',
      'dirEntityId',
      'selected',
    ]),

    _window: window,

    /**
     * Set on init.
     * @type {Utils.FilesystemBrowserModel}
     */
    browserModel: undefined,

    /**
     * @type {Models.File}
     */
    fileForConfirmDownload: undefined,

    fileToShowInfo: undefined,

    showInfoInitialTab: undefined,

    fileToShowMetadata: undefined,

    /**
     * Initialized on init.
     * @type {Array<Models.File>}
     */
    selectedFiles: undefined,

    /**
     * @type {ComputedProperty<Object>}
     */
    spacePrivileges: reads('spaceProxy.content.privileges'),

    spaceProxy: promise.object(computed('spaceEntityId', function spaceProxy() {
      const {
        spaceManager,
        spaceEntityId,
      } = this.getProperties('spaceManager', 'spaceEntityId');
      return spaceManager.getSpace(spaceEntityId);
    })),

    /**
     * NOTE: observing only space, because it should reload initial dir after whole space change
     * @type {PromiseObject<Models.File>}
     */
    initialDirProxy: promise.object(computed('spaceProxy', function initialDirProxy() {
      return this.get('dirProxy');
    })),

    /**
     * NOTE: not observing anything, because it should be one-time proxy
     * @type {PromiseObject<Models.File>}
     */
    initialSelectedFilesForJumpProxy: promise.object(computed(
      function initialSelectedFilesForJumpProxy() {
        return this.get('selectedFilesForJumpProxy');
      }
    )),

    selectedFilesForJumpProxy: promise.object(
      computed('selected', function selectedFilesForJumpProxy() {
        const {
          selected,
          fileManager,
          dirProxy,
        } = this.getProperties('selected', 'fileManager', 'dirProxy');
        if (selected) {
          // TODO: something is broken and changing to empty array propagates back to OP
          // changing selection in file browser should clear Onezone's selection from URL
          // because it's one-way relation
          // this.callParent('updateSelected', []);
          return onlyFulfilledValues(selected.map(id => fileManager.getFileById(id)))
            .then(files => {
              return dirProxy.then(dir => !dir ? [] : files.filter(file => {
                const parentGri = file.belongsTo('parent').id();
                if (parentGri) {
                  // filter out files that have other parents than opened dir
                  return parseGri(parentGri).entityId === get(dir, 'entityId');
                } else {
                  return false;
                }
              }));
            })
            .catch(error => {
              console.error(
                `component:content-file-browser#selectedFilesForJumpProxy: error loading selected files: ${error}`
              );
              return resolve([]);
            });
        }
      })
    ),

    initialRequiredDataProxy: promise.object(promise.all(
      'spaceProxy',
      'initialSelectedFilesForJumpProxy',
      'initialDirProxy'
    )),

    selectedFilesForJump: reads('selectedFilesForJumpProxy.content'),

    injectedDirGri: computed('dirEntityId', 'spaceEntityId', function injectedDirGri() {
      const {
        spaceEntityId,
        dirEntityId,
      } = this.getProperties('spaceEntityId', 'dirEntityId');
      let isValidDirEntityId;
      try {
        isValidDirEntityId = dirEntityId &&
          getSpaceIdFromFileId(dirEntityId) === spaceEntityId;
      } catch (error) {
        isValidDirEntityId = false;
      }
      if (isValidDirEntityId) {
        return gri({
          entityType: 'file',
          entityId: dirEntityId,
          aspect: 'instance',
          scope: 'private',
        });
      } else {
        return null;
      }
    }),

    fallbackDirProxy: promise.object(computed(
      'spaceProxy.rootDir',
      async function fallbackDirProxy() {
        const space = await this.get('spaceProxy');
        if (space) {
          return get(space, 'rootDir');
        }
      }
    )),

    dirProxy: promise.object(computed(
      'injectedDirGri',
      'spaceProxy',
      async function dirProxy() {
        const {
          injectedDirGri,
          store,
          globalNotify,
          _window,
        } = this.getProperties('injectedDirGri', 'store', 'globalNotify', '_window');

        if (!injectedDirGri) {
          return this.get('fallbackDirProxy');
        }

        const redirectUrl = await this.openSelectedParentDir();
        if (redirectUrl) {
          return new Promise(() => {
            _window.open(redirectUrl, '_top');
          });
        }

        try {
          // TODO: VFS-7643 refactor to use file-manager
          const dirItem = await store.findRecord('file', injectedDirGri);
          const type = get(dirItem, 'type');
          if (
            type === 'dir' ||
            type === 'symlink' && get(dirItem, 'effFile.type') === 'dir'
          ) {
            return dirItem;
          } else {
            return get(dirItem, 'parent');
          }
        } catch (error) {
          globalNotify.backendError(this.t('openingDirectory'), error);
          return this.get('fallbackDirProxy');
        }
      }
    )),

    dir: computedLastProxyContent('dirProxy'),

    spaceObserver: observer('spaceProxy.content', function spaceObserver() {
      this.get('uploadManager').changeTargetSpace(this.get('spaceProxy.content'));
    }),

    /**
     * Observer: watch if injected selection and dir changed to redirect to correct URL
     */
    injectedDirObserver: observer(
      'injectedDirGri',
      'selected',
      function injectedDirObserver() {
        this.openSelectedParentDir();
      }
    ),

    /**
     * Observer: override selected files when value injected from outside changes
     */
    injectedSelectedChanged: observer(
      'selectedFilesForJumpProxy.content',
      function injectedSelectedChanged() {
        const selectedFilesForJump = this.get('selectedFilesForJumpProxy.content');
        if (selectedFilesForJump) {
          this.set('selectedFilesForJump', selectedFilesForJump);
        }
      }),

    spaceEntityIdObserver: observer('spaceEntityId', function spaceEntityIdObserver() {
      this.closeAllModals();
      this.clearFilesSelection();
      this.get('containerScrollTop')(0);
    }),

    init() {
      this._super(...arguments);
      if (!this.get('selectedFiles')) {
        this.set('selectedFiles', []);
      }
      this.set('browserModel', this.createBrowserModel());
    },

    getItemById(itemId) {
      return this.get('fileManager').getFileById(itemId, 'private');
    },

    createBrowserModel() {
      return FilesystemBrowserModel.create({
        ownerSource: this,
        openCreateNewDirectory: (parent) => this.openCreateItemModal('dir', parent),
        openRemove: this.openRemoveModal.bind(this),
        openRename: this.openRenameModal.bind(this),
        openInfo: this.openInfoModal.bind(this),
        openMetadata: this.openMetadataModal.bind(this),
        openShare: this.openShareModal.bind(this),
        openDatasets: this.openDatasetsModal.bind(this),
        openEditPermissions: this.openEditPermissionsModal.bind(this),
        openFileDistribution: this.openFileDistributionModal.bind(this),
        openQos: this.openQosModal.bind(this),
        openConfirmDownload: this.openConfirmDownload.bind(this),
      });
    },

    /**
     * Optionally redirects Onezone to URL containing parent directory of first
     * selected file (if there is no injected dir id and at least one selected file).
     * If there is no need to redirect, resolves false.
     * @returns {Promise}
     */
    openSelectedParentDir() {
      if (!this.get('injectedDirGri')) {
        const selected = this.get('selected');
        const firstSelectedId = selected && selected[0];
        if (firstSelectedId) {
          const fileManager = this.get('fileManager');
          return fileManager.getFileById(firstSelectedId)
            .then(file => {
              const parentGri = file.belongsTo('parent').id();
              if (parentGri) {
                const parentId = parseGri(parentGri).entityId;
                const dataUrl = this.callParent(
                  'getDataUrl', {
                    fileId: parentId,
                    selected,
                  }
                );
                return resolve(dataUrl);
              } else if (get(selected, 'length') === 0) {
                const dataUrl = this.callParent(
                  'getDataUrl', {
                    fileId: selected[0],
                    selected: null,
                  }
                );
                return resolve(dataUrl);
              } else {
                return resolve(null);
              }
            })
            .catch(() => null);
        } else {
          return resolve(null);
        }
      } else {
        return resolve(null);
      }
    },

    openCreateItemModal(itemType, parentDir) {
      this.setProperties({
        createItemParentDir: parentDir,
        createItemType: itemType,
      });
    },
    closeCreateItemModal(isCreated, file) {
      if (isCreated && file) {
        const fileId = get(file, 'entityId');
        this.callParent('updateSelected', [fileId]);
      }
      this.setProperties({
        createItemParentDir: null,
        createItemType: null,
      });
    },
    openRemoveModal(files, parentDir) {
      this.setProperties({
        filesToRemove: [...files],
        removeParentDir: parentDir,
      });
    },
    closeRemoveModal(removeInvoked, results) {
      const newIds = [];
      if (removeInvoked) {
        for (const fileId in results) {
          if (get(results[fileId], 'state') === 'rejected') {
            newIds.push(fileId);
          }
        }
      }
      this.set(
        'selectedFiles',
        this.get('filesToRemove').filter(file => newIds.includes(get(file, 'entityId')))
      );
      this.setProperties({
        filesToRemove: null,
        removeParentDir: null,
      });
    },
    openRenameModal(file, parentDir) {
      this.setProperties({
        fileToRename: file,
        renameParentDir: parentDir,
      });
    },
    openInfoModal(file, activeTab) {
      this.setProperties({
        fileToShowInfo: file,
        showInfoInitialTab: activeTab || 'general',
      });
    },
    openMetadataModal(file) {
      this.set('fileToShowMetadata', file);
    },
    openDatasetsModal(files) {
      this.set('filesToShowDatasets', files);
    },
    openShareModal(file) {
      this.set('fileToShare', file);
    },
    openEditPermissionsModal(files) {
      this.set('filesToEditPermissions', [...files]);
    },
    openFileDistributionModal(files) {
      this.set('filesToShowDistribution', [...files]);
    },
    openQosModal(files) {
      this.set('filesToShowQos', files);
    },
    openConfirmDownload(file) {
      this.set('fileForConfirmDownload', file);
    },
    closeRenameModal() {
      this.setProperties({
        fileToRename: null,
        renameParentDir: null,
      });
    },
    closeInfoModal() {
      this.set('fileToShowInfo', null);
    },
    closeMetadataModal() {
      this.set('fileToShowMetadata', null);
    },
    closeShareModal() {
      this.set('fileToShare', null);
    },
    closeDatasetsModal() {
      this.set('filesToShowDatasets', null);
    },
    closeEditPermissionsModal() {
      this.set('filesToEditPermissions', null);
    },
    closeFileDistributionModal() {
      this.set('filesToShowDistribution', null);
    },
    closeQosModal() {
      this.set('filesToShowQos', null);
    },

    closeAllModals() {
      this.closeCreateItemModal();
      this.closeRemoveModal();
      this.closeRenameModal();
      this.closeInfoModal();
      this.closeMetadataModal();
      this.closeShareModal();
      this.closeEditPermissionsModal();
      this.closeFileDistributionModal();
      this.closeQosModal();
    },

    clearFilesSelection() {
      this.set('selectedFiles', []);
      this.set('selectedFilesForJump', []);
    },

    actions: {
      containerScrollTop() {
        return this.get('containerScrollTop')(...arguments);
      },
      changeSelectedFiles(selectedFiles) {
        this.set('selectedFiles', selectedFiles);
      },
      updateDirEntityId(dirEntityId) {
        this.callParent('updateDirEntityId', dirEntityId);
      },
      getTransfersUrl({ fileId, tabId }) {
        return this.callParent('getTransfersUrl', { fileId, tabId });
      },
      getShareUrl({ shareId }) {
        return this.callParent('getShareUrl', { shareId });
      },

      /**
       * @param {Object} data
       * @param {String} data.fileId entity id of directory to open
       * @param {String|Array<String>} data.selected list of entity ids of files
       *  to be selected on view
       * @returns {String}
       */
      getDataUrl(data) {
        return this.callParent('getDataUrl', data);
      },

      getDatasetsUrl(data) {
        return this.callParent('getDatasetsUrl', data);
      },

      closeConfirmFileDownload() {
        this.set('fileForConfirmDownload', null);
      },
      confirmFileDownload() {
        return this.get('browserModel')
          .downloadFiles([
            this.get('fileForConfirmDownload'),
          ])
          .finally(() => {
            safeExec(this, 'set', 'fileForConfirmDownload', null);
          });
      },
    },
  }
);
