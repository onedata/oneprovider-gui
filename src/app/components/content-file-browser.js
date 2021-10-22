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
import { computed, get, getProperties, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import ContentSpaceBaseMixin from 'oneprovider-gui/mixins/content-space-base';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { promise } from 'ember-awesome-macros';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import onlyFulfilledValues from 'onedata-gui-common/utils/only-fulfilled-values';
import FilesystemBrowserModel from 'oneprovider-gui/utils/filesystem-browser-model';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import ItemBrowserContainerBase from 'oneprovider-gui/mixins/item-browser-container-base';
import { executeWorkflowDataLocalStorageKey } from 'oneprovider-gui/components/space-automation/input-stores-form';
import FilesViewContext from 'oneprovider-gui/utils/files-view-context';

export default OneEmbeddedComponent.extend(
  I18n,
  ContentSpaceBaseMixin,
  ItemBrowserContainerBase, {
    classNames: ['content-file-browser', 'upload-drop-zone-container'],

    /**
     * @override
     */
    i18nPrefix: 'components.contentFileBrowser',

    store: service(),
    fileManager: service(),
    uploadManager: service(),
    spaceManager: service(),
    workflowManager: service(),
    globalNotify: service(),
    filesViewResolver: service(),

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

    /**
     * @type {Storage}
     */
    _localStorage: localStorage,

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
    selectedItems: undefined,

    /**
     * @type {String}
     */
    navigateTarget: '_top',

    /**
     * @override
     */
    selectedItemsForJumpProxy: promise.object(
      computed('selected', async function selectedItemsForJumpProxy() {
        const {
          selected,
          fileManager,
          dirProxy,
        } = this.getProperties('selected', 'fileManager', 'dirProxy');
        if (selected) {
          try {
            const files = await onlyFulfilledValues(selected.map(id =>
              fileManager.getFileById(id)
            ));
            const dir = await dirProxy;
            if (!dir) {
              return [];
            }

            const validFiles = await files.filter(file => {
              const fileId = file && file.relationEntityId('parent');
              if (!fileId) {
                return false;
              }
              // filter out files that have other parents than opened dir
              return fileId === get(dir, 'entityId');
            });

            return validFiles;
          } catch (error) {
            console.error(
              `component:content-file-browser#selectedItemsForJumpProxy: error loading selected files: ${error}`
            );
          }
        }
      })
    ),

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

    initialRequiredDataProxy: promise.object(promise.all(
      'spaceProxy',
      'initialSelectedItemsForJumpProxy',
      'initialDirProxy'
    )),

    selectedItemsForJump: reads('selectedItemsForJumpProxy.content'),

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
      'dirEntityId',
      'spaceId',
      async function dirProxy() {
        const {
          spaceEntityId,
          selected,
          dirEntityId,
          filesViewResolver,
          fallbackDirProxy,
          _window,
        } = this.getProperties(
          'spaceEntityId',
          'selected',
          'dirEntityId',
          'filesViewResolver',
          'fallbackDirProxy',
          '_window',
        );

        const currentFilesViewContext = FilesViewContext.create({
          spaceId: spaceEntityId,
        });
        const fallbackDir = await fallbackDirProxy;

        const resolverResult = await filesViewResolver.resolveViewOptions({
          dirId: dirEntityId,
          currentFilesViewContext,
          selectedIds: selected,
          scope: 'private',
          fallbackDir: await fallbackDirProxy,
        });

        if (!resolverResult) {
          return null;
        }
        if (resolverResult.result === 'resolve') {
          return resolverResult.dir;
        } else {
          // TODO: VFS-8342 common util for replacing master URL
          if (resolverResult.url) {
            _window.top.location.replace(resolverResult.url);
          }
          return fallbackDir;
        }
      }
    )),

    // async resolveDirForGri(dirGri) {
    //   const {
    //     store,
    //     globalNotify,
    //   } = this.getProperties('store', 'globalNotify');

    //   try {
    //     // TODO: VFS-7643 refactor to use file-manager
    //     const dirItem = await store.findRecord('file', dirGri);
    //     const type = get(dirItem, 'type');
    //     if (
    //       type === 'dir' ||
    //       type === 'symlink' && get(dirItem, 'effFile.type') === 'dir'
    //     ) {
    //       return dirItem;
    //     } else {
    //       return get(dirItem, 'parent');
    //     }
    //   } catch (error) {
    //     globalNotify.backendError(this.t('openingDirectory'), error);
    //     return this.get('fallbackDirProxy');
    //   }
    // },

    // async resolveDirForSelectedIds(selectedIds) {
    //   // NOTE: fallbackDirProxy is not got using `get` to avoid loading it
    //   // unnecessarily
    //   const _window = this.get('_window');

    //   if (isEmpty(selectedIds)) {
    //     // no dir nor selected files provided - go home
    //     return this.get('fallbackDirProxy');
    //   } else {
    //     const redirectOptions = await this.resolveSelectedParentDirUrl();
    //     if (redirectOptions) {
    //       // TODO: VFS-8342 common util for replacing master URL
    //       _window.top.location.replace(redirectOptions.dataUrl);
    //       return (await redirectOptions.dirProxy) || this.get('fallbackDirProxy');
    //     } else {
    //       // resolving parent from selection failed - fallback to home
    //       return this.get('fallbackDirProxy');
    //     }
    //   }
    // },

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
        this.resolveSelectedParentDirUrl();
      }
    ),

    spaceEntityIdObserver: observer('spaceEntityId', function spaceEntityIdObserver() {
      this.closeAllModals();
      this.clearFilesSelection();
      this.get('containerScrollTop')(0);
    }),

    init() {
      this._super(...arguments);
      this.set('browserModel', this.createBrowserModel());
    },

    getItemById(itemId) {
      return this.get('fileManager').getFileById(itemId, 'private');
    },

    createBrowserModel() {
      return FilesystemBrowserModel.create({
        ownerSource: this,
        openBagitUploader: this.openBagitUploader.bind(this),
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
        openWorkflowRunView: this.openWorkflowRunView.bind(this),
      });
    },

    /**
     * Optionally computes Onezone URL redirect options for containing parent directory of
     * first selected file (if there is no injected dir id and at least one selected
     * file). If there is no need to redirect, resolves false.
     * @returns {Promise<{dataUrl: string, dirProxy: PromiseObject}>}
     */
    async resolveSelectedParentDirUrl() {
      const {
        injectedDirGri,
        selected,
        fileManager,
      } = this.getProperties('injectedDirGri', 'selected', 'fileManager');
      const firstSelectedId = selected && selected[0];

      if (injectedDirGri || !firstSelectedId) {
        // no need to resolve parent dir, as it is already specified or there is no
        // selection specified
        return null;
      }

      let firstSelectedFile;
      try {
        firstSelectedFile = await fileManager.getFileById(firstSelectedId);
      } catch (error) {
        console.debug(
          `component:content-file-browser#resolveSelectedParentDirUrl: cannot resolve first selected file: "${error}"`
        );
        return null;
      }
      const parentId = firstSelectedFile &&
        firstSelectedFile.relationEntityId('parent');
      if (parentId) {
        const dataUrl = this.callParent(
          'getDataUrl', {
            fileId: parentId,
            selected,
          }
        );
        return { dataUrl, dirProxy: get(firstSelectedFile, 'parent') };
      } else {
        return null;
      }
    },

    openWorkflowRunView({ atmWorkflowSchemaId, inputStoresData }) {
      const {
        _window,
        _localStorage,
        navigateTarget,
        globalNotify,
      } = this.getProperties('_window', '_localStorage', 'navigateTarget', 'globalNotify');
      if (!atmWorkflowSchemaId) {
        return;
      }
      if (inputStoresData) {
        const executeWorkflowData = {
          atmWorkflowSchemaId,
          inputStoresData,
        };
        try {
          _localStorage.setItem(
            executeWorkflowDataLocalStorageKey,
            JSON.stringify(executeWorkflowData)
          );
        } catch (error) {
          console.error(
            'component:content-file-browser#openWorkflowRunView: Persisting initial values for workflow run failed',
            error
          );
          globalNotify.error(String(this.t('runWorkflowLocalStorageError')));
          return;
        }
      }
      const redirectUrl = this.callParent('getExecuteWorkflowUrl', {
        workflowSchemaId: atmWorkflowSchemaId,
        fillInputStores: Boolean(inputStoresData),
      });
      _window.open(redirectUrl, navigateTarget);
    },

    openBagitUploader() {
      const {
        isBagitUploaderAvailable,
        bagitUploaderWorkflowSchemaId,
      } = getProperties(
        this.get('workflowManager'),
        'isBagitUploaderAvailable',
        'bagitUploaderWorkflowSchemaId'
      );
      if (!isBagitUploaderAvailable) {
        return;
      }
      this.openWorkflowRunView({ atmWorkflowSchemaId: bagitUploaderWorkflowSchemaId });
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
      const filesToRemove = this.get('filesToRemove');
      if (filesToRemove) {
        this.changeSelectedItems(
          filesToRemove.filter(file => newIds.includes(get(file, 'entityId')))
        );
      }
      this.setProperties({
        filesToRemove: null,
        removeParentDir: null,
      });
    },
    openRenameModal(file) {
      this.set('fileToRename', file);
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
      this.set('fileToRename', null);
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
      return this.changeSelectedItems([]);
    },

    actions: {
      containerScrollTop() {
        return this.get('containerScrollTop')(...arguments);
      },
      changeSelectedItems(selectedItems) {
        return this.changeSelectedItems(selectedItems);
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
