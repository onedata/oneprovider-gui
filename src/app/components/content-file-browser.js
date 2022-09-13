/**
 * Container for file browser to use in an iframe with injected properties.
 *
 * @module component/content-file-browser
 * @author Jakub Liput
 * @copyright (C) 2019-2022 ACK CYFRONET AGH
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
import { isEmpty } from '@ember/utils';
import sortRevisionNumbers from 'onedata-gui-common/utils/revisions/sort-revision-numbers';
import InfoModalBrowserSupport from 'oneprovider-gui/mixins/info-modal-browser-support';

export default OneEmbeddedComponent.extend(
  I18n,
  ContentSpaceBaseMixin,
  ItemBrowserContainerBase,
  InfoModalBrowserSupport, {
    classNames: [
      'content-file-browser',
      'content-items-browser',
      'upload-drop-zone-container',
    ],

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
    parentAppNavigation: service(),

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

    fileToShowRecallInfo: undefined,

    /**
     * Initialized on init.
     * @type {Array<Models.File>}
     */
    selectedItems: undefined,

    /**
     * @type {ComputedProperty<Boolean>}
     */
    effUploadDisabled: reads('dir.dataIsProtected'),

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
     * @type {ComputedProperty<SpacePrivileges>}
     */
    spacePrivileges: reads('spaceProxy.content.privileges'),

    spaceProxy: promise.object(computed('spaceEntityId', function spaceProxy() {
      const {
        spaceManager,
        spaceEntityId,
      } = this.getProperties('spaceManager', 'spaceEntityId');
      return spaceManager.getSpace(spaceEntityId);
    })),

    dirStatsServiceStateProxy: promise.object(computed(
      'spaceEntityId',
      function dirStatsServiceStateProxy() {
        const {
          spaceManager,
          spaceEntityId,
        } = this.getProperties('spaceManager', 'spaceEntityId');
        return spaceManager.fetchDirStatsServiceState(spaceEntityId);
      }
    )),

    /**
     * NOTE: observing only space, because it should reload initial dir after whole space change
     * @type {PromiseObject<Models.File>}
     */
    initialDirProxy: promise.object(computed('spaceProxy', function initialDirProxy() {
      return this.get('dirProxy');
    })),

    /**
     * @type {ComputedProperty<PromiseObject>}
     */
    bagitUploaderLoaderProxy: reads('workflowManager.bagitUploaderWorkflowSchemaProxy'),

    initialRequiredDataProxy: promise.object(promise.all(
      'spaceProxy',
      'initialSelectedItemsForJumpProxy',
      'initialDirProxy',
      'bagitUploaderLoaderProxy',
      'dirStatsServiceStateProxy'
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
      'spaceEntityId',
      'selected',
      async function dirProxy() {
        const {
          spaceEntityId,
          selected,
          dirEntityId,
          filesViewResolver,
          fallbackDirProxy,
          parentAppNavigation,
        } = this.getProperties(
          'spaceEntityId',
          'selected',
          'dirEntityId',
          'filesViewResolver',
          'fallbackDirProxy',
          'parentAppNavigation',
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
          fallbackDir,
        });

        if (!resolverResult) {
          return null;
        }
        if (resolverResult.result === 'resolve') {
          return resolverResult.dir;
        } else {
          if (resolverResult.url) {
            parentAppNavigation.openUrl(resolverResult.url, true);
          }
          return fallbackDir;
        }
      }
    )),

    dir: computedLastProxyContent('dirProxy'),

    spaceObserver: observer('spaceProxy.content', function spaceObserver() {
      this.get('uploadManager').changeTargetSpace(this.get('spaceProxy.content'));
    }),

    dirObserver: observer('dir', function dirObserver() {
      this.closeAllModals();
    }),

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
      return this.get('fileManager').getFileById(itemId, { scope: 'private' });
    },

    createBrowserModel() {
      return FilesystemBrowserModel.create({
        ownerSource: this,
        openBagitUploader: this.openBagitUploader.bind(this),
        openCreateNewDirectory: (parent) => this.openCreateItemModal('dir', parent),
        openRemove: this.openRemoveModal.bind(this),
        openRename: this.openRenameModal.bind(this),
        openInfo: this.openInfoModal.bind(this),
        openRecallInfo: this.openRecallInfoModal.bind(this),
        openDatasets: this.openDatasetsModal.bind(this),
        openConfirmDownload: this.openConfirmDownload.bind(this),
        openWorkflowRunView: this.openWorkflowRunView.bind(this),
        closeAllModals: this.closeAllModals.bind(this),
      });
    },

    openWorkflowRunView({
      atmWorkflowSchemaId,
      atmWorkflowSchemaRevisionNumber,
      inputStoresData,
    }) {
      const {
        _localStorage,
        globalNotify,
        parentAppNavigation,
      } = this.getProperties('_localStorage', 'globalNotify', 'parentAppNavigation');
      if (!atmWorkflowSchemaId || !atmWorkflowSchemaRevisionNumber) {
        return;
      }
      if (inputStoresData) {
        const executeWorkflowData = {
          atmWorkflowSchemaId,
          atmWorkflowSchemaRevisionNumber,
          inputStoresData,
        };
        try {
          _localStorage.setItem(
            executeWorkflowDataLocalStorageKey,
            JSON.stringify(executeWorkflowData)
          );
        } catch (error) {
          console.error(
            'component:content-file-browser#openWorkflowRunView: Persisting initial contents for workflow run failed',
            error
          );
          globalNotify.error(String(this.t('runWorkflowLocalStorageError')));
          return;
        }
      }
      const redirectUrl = this.callParent('getExecuteWorkflowUrl', {
        workflowSchemaId: atmWorkflowSchemaId,
        workflowSchemaRevision: atmWorkflowSchemaRevisionNumber,
        fillInputStores: Boolean(inputStoresData),
      });
      parentAppNavigation.openUrl(redirectUrl);
    },

    openBagitUploader() {
      const {
        isBagitUploaderAvailable,
        bagitUploaderWorkflowSchemaProxy,
      } = getProperties(
        this.get('workflowManager'),
        'isBagitUploaderAvailable',
        'bagitUploaderWorkflowSchemaProxy'
      );
      if (!isBagitUploaderAvailable) {
        return;
      }
      // isBagitUploaderAvailable === true means, that
      // bagitUploaderWorkflowSchemaProxy has resolved value and non-empty
      // revision registry
      const {
        entityId,
        revisionRegistry,
      } = getProperties(
        bagitUploaderWorkflowSchemaProxy,
        'entityId',
        'revisionRegistry'
      );
      const revNumbers =
        sortRevisionNumbers(Object.keys(revisionRegistry || {})).reverse();
      const latestStableRevNumber = revNumbers.find(revNumber =>
        revisionRegistry[revNumber].state === 'stable'
      );
      const latestDraftRevNumber = revNumbers.find(revNumber =>
        revisionRegistry[revNumber].state === 'draft'
      );
      const revNumberToRun = latestStableRevNumber ||
        latestDraftRevNumber ||
        revNumbers[0];
      this.openWorkflowRunView({
        atmWorkflowSchemaId: entityId,
        atmWorkflowSchemaRevisionNumber: revNumberToRun,
      });
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

    openRecallInfoModal(file) {
      this.set('fileToShowRecallInfo', file);
    },
    openDatasetsModal(files) {
      this.set('filesToShowDatasets', files);
    },
    openConfirmDownload(file) {
      this.set('fileForConfirmDownload', file);
    },
    closeRenameModal() {
      this.set('fileToRename', null);
    },
    closeRecallInfoModal() {
      this.set('fileToShowRecallInfo', null);
    },
    closeDatasetsModal() {
      const {
        uploadManager,
        dir,
      } = this.getProperties('uploadManager', 'dir');
      this.set('filesToShowDatasets', null);
      // datasets browser could have recall panel opened that can change upload target
      // directory, so make sure that it is restored
      uploadManager.changeTargetDirectory(dir);
    },

    closeAllModals() {
      this.closeCreateItemModal();
      this.closeRemoveModal();
      this.closeRenameModal();
      this.closeInfoModal();
      this.closeDatasetsModal();
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
      getProvidersUrl({ oneproviderId }) {
        return this.callParent('getProvidersUrl', { oneproviderId });
      },

      getDatasetsUrl(data) {
        return this.callParent('getDatasetsUrl', data);
      },

      /**
       * @param {Object} data
       * @param {String} data.fileId entity id of directory to open
       * @param {String|Array<String>} data.selected list of entity ids of files
       *  to be selected on view
       * @returns {String}
       */
      async getFileUrl({ fileId, selected }) {
        let id;
        let type;
        if (isEmpty(selected)) {
          id = fileId;
          type = 'open';
        } else {
          id = selected[0];
          type = 'select';
        }
        return this.get('filesViewResolver').generateUrlById(id, type);
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
      closeAllModals() {
        this.closeAllModals();
      },
    },
  }
);
