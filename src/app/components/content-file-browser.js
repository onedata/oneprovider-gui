/**
 * Container for file browser to use in an iframe with injected properties.
 *
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
import globals from 'onedata-gui-common/utils/globals';
import { all as allFulfilled } from 'rsvp';
import waitForRender from 'onedata-gui-common/utils/wait-for-render';
import FileConsumerMixin from 'oneprovider-gui/mixins/file-consumer';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';
import { getFileGri } from 'oneprovider-gui/models/file';

export default OneEmbeddedComponent.extend(
  I18n,
  ContentSpaceBaseMixin,
  ItemBrowserContainerBase,
  InfoModalBrowserSupport,
  FileConsumerMixin, {
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
    alert: service(),

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
     * **Injected from parent frame.**
     * @virtual optional
     * @type {FilesystemBrowserModel.Command}
     */
    fileAction: null,

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
      'fileAction',
    ]),

    /**
     * @override
     */
    iframeInjectedNavigationProperties: Object.freeze([
      'spaceEntityId',
      'dirEntityId',
      'fileAction',
    ]),

    /**
     * Set on init.
     * @type {Utils.FilesystemBrowserModel}
     */
    browserModel: undefined,

    /**
     * A flag indicating that this file browser will be closed immediately to open another
     * file browser (archive filesystem in datasets browser, etc.), because file should
     * not be shown in this context.
     */
    willRedirectToOtherBrowser: false,

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
     * Used by `fileActionObserver` to prevent multiple async invocations which is unsafe.
     * @type {boolean}
     */
    fileActionObserverLock: false,

    /**
     * @override
     * @implements {Mixins.FileConsumer}
     */
    fileRequirements: computed('dirGri', function fileRequirements() {
      if (!this.dirGri) {
        return [];
      }
      return [
        FileRequirement.create({
          debug: 'content-file-browser',
          fileGri: this.dirGri,
          properties: ['parent', 'type', 'effFile'],
        }),
      ];
    }),

    /**
     * @override
     * @implements {Mixins.FileConsumer}
     */
    usedFiles: computed('dir', function usedFiles() {
      if (!this.dir) {
        return [];
      }
      return [this.dir];
    }),

    dirGri: computed('dirEntityId', function dirGri() {
      return getFileGri(this.dirEntityId, 'private');
    }),

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
            let dir;
            try {
              dir = await dirProxy;
            } catch {
              // allow dirProxy to fail - eg. when entering non-existing directory
              return [];
            }
            if (!dir) {
              return [];
            }
            const files = await onlyFulfilledValues(selected.map(id =>
              fileManager.getFileById(id)
            ));

            const validFiles = await files.filter(file => {
              const fileId = file && file.relationEntityId('parent');
              if (!fileId) {
                return false;
              }
              // filter out files that have other parents than opened dir
              return fileId === get(dir, 'entityId');
            });

            (async () => {
              if (this.willRedirectToOtherBrowser) {
                return;
              }
              if (validFiles.length < selected.length) {
                if (selected.length === 1) {
                  this.alert.warning(this.t('selectedNotFound.single'));
                } else if (selected.length > 1) {
                  this.alert.warning(this.t('selectedNotFound.many'));
                }
              }
            })();
            return validFiles;
          } catch (error) {
            console.error(
              `component:content-file-browser#selectedItemsForJumpProxy: error loading selected files: ${JSON.stringify(error)}`
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
        return spaceManager.getDirStatsServiceState(spaceEntityId);
      }
    )),

    /**
     * NOTE: observing only space, because it should reload initial dir after whole space change
     * @type {PromiseObject<Models.File>}
     */
    initialDirProxy: promise.object(computed(
      'spaceProxy',
      async function initialDirProxy() {
        return this.dirProxy;
      }
    )),

    /**
     * Always resolved when `initialDirProxy` settles (no matter if it resolves of rejects).
     */
    initialDirLoadingProxy: promise.object(computed(
      'initialDirProxy',
      async function initialDirLoadingProxy() {
        try {
          return await this.dirProxy;
        } catch {
          return null;
        }
      }
    )),

    /**
     * @type {ComputedProperty<PromiseObject>}
     */
    bagitUploaderLoaderProxy: reads('workflowManager.bagitUploaderWorkflowSchemaProxy'),

    initialRequiredDataProxy: promise.object(computed(
      // NOTE: not observing all proxies, because loading part of them does not affects
      // ability to display the view
      'spaceProxy',
      'initialDirLoadingProxy',
      function initialRequiredDataProxy() {
        return allFulfilled([
          this.spaceProxy,
          this.initialDirLoadingProxy,
          this.initialSelectedItemsForJumpProxy,
          this.bagitUploaderLoaderProxy,
          this.dirStatsServiceStateProxy,
        ]);
      }
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
          fileAction,
        } = this.getProperties(
          'spaceEntityId',
          'selected',
          'dirEntityId',
          'filesViewResolver',
          'fallbackDirProxy',
          'parentAppNavigation',
          'fileAction',
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
          fileAction,
        });

        if (!resolverResult) {
          return null;
        }
        if (resolverResult.result === 'resolve') {
          return resolverResult.dir;
        } else {
          if (resolverResult.url) {
            this.set('willRedirectToOtherBrowser', true);
            parentAppNavigation.openUrl(resolverResult.url, true);
          }
          return fallbackDir;
        }
      }
    )),

    dir: computedLastProxyContent('dirProxy', { nullOnReject: true }),

    dirError: reads('dirProxy.reason'),

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

    fileActionObserver: observer(
      'fileAction',
      // additional properties, that should invoke file action from URL
      'selected',
      function fileActionObserver() {
        if (this.fileActionObserverLock || !this.fileAction) {
          return;
        }
        this.set('fileActionObserverLock', true);
        (async () => {
          try {
            await this.initialRequiredDataProxy;
            await this.dirProxy;
            if (this.willRedirectToOtherBrowser) {
              return;
            }
            await waitForRender();
            this.browserModel.invokeCommand(this.fileAction);
          } finally {
            if (!this.willRedirectToOtherBrowser) {
              safeExec(this, () => {
                this.callParent('updateFileAction', null);
              });
            }
            safeExec(this, () => {
              this.set('fileActionObserverLock', false);
            });
          }
        })();
      }
    ),

    init() {
      this._super(...arguments);
      this.set('browserModel', this.createBrowserModel());
      this.fileActionObserver();
    },

    /**
     * @override
     */
    willDestroyElement() {
      try {
        this.browserModel?.destroy?.();
      } finally {
        this._super(...arguments);
      }
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
        globalNotify,
        parentAppNavigation,
      } = this.getProperties('globalNotify', 'parentAppNavigation');
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
          globals.localStorage.setItem(
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
    openRemoveModal(files, parentDir, onRemoved) {
      this.setProperties({
        filesToRemove: [...files],
        removeParentDir: parentDir,
        onFilesRemoved: onRemoved,
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
        onFilesRemoved: null,
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
  });
