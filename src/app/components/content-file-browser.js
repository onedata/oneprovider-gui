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
import { resolve } from 'rsvp';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import onlyFulfilledValues from 'onedata-gui-common/utils/only-fulfilled-values';

export default OneEmbeddedComponent.extend(
  I18n,
  ContentSpaceBaseMixin, {
    classNames: ['content-file-browser'],

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
     * @virtual optional
     */
    dirEntityId: undefined,

    _window: window,

    fileToShowInfo: undefined,

    fileToShowMetadata: undefined,

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
    initialSelectedFilesProxy: promise.object(computed(
      function initialSelectedFilesProxy() {
        return this.get('selectedFilesProxy');
      }
    )),

    selectedFilesProxy: promise.object(
      computed('selected', function selectedFilesProxy() {
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
                `component:content-file-browser#selectedFilesProxy: error loading selected files: ${error}`
              );
              return resolve([]);
            });
        }
      })
    ),

    initialRequiredDataProxy: promise.object(promise.all(
      'initialSelectedFilesProxy',
      'initialDirProxy'
    )),

    selectedFiles: reads('selectedFilesProxy.content'),

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

    dirProxy: promise.object(computed(
      'injectedDirGri',
      'spaceProxy',
      function dirProxy() {
        const {
          injectedDirGri,
          spaceProxy,
          store,
          globalNotify,
          _window,
        } = this.getProperties('injectedDirGri', 'spaceProxy', 'store', 'globalNotify', '_window');

        return this.openSelectedParentDir().then(redirectUrl => {
          if (redirectUrl) {
            _window.open(redirectUrl, '_top');
            return null;
          } else {
            return spaceProxy.then(space => {
              if (injectedDirGri) {
                return store.findRecord('file', injectedDirGri)
                  .then(file => get(file, 'type') === 'file' ? get(file, 'parent') : file)
                  .catch(error => {
                    globalNotify.backendError(this.t('openingDirectory'), error);
                    return get(space, 'rootDir');
                  });
              } else {
                return get(space, 'rootDir');
              }
            });
          }
        });
      }
    )),

    dir: computedLastProxyContent('dirProxy'),

    spaceObserver: observer('spaceProxy.content', function spaceObserver() {
      this.get('uploadManager').changeTargetSpace(this.get('spaceProxy.content'));
    }),

    /**
     * Observer: watch if injected selection and dir changed to redirect to correct URL
     * @type <Function>
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
     * @type <Function>
     */
    injectedSelectedChanged: observer(
      'selectedFilesProxy.content',
      function injectedSelectedChanged() {
        const selectedFiles = this.get('selectedFilesProxy.content');
        if (selectedFiles) {
          this.set('selectedFiles', selectedFiles);
        }
      }),

    spaceEntityIdObserver: observer('spaceEntityId', function spaceEntityIdObserver() {
      this.closeAllModals();
      this.clearFilesSelection();
      this.get('containerScrollTop')(0);
    }),

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

    closeCreateItemModal() {
      this.setProperties({
        createItemParentDir: null,
        createItemType: null,
      });
    },

    closeRemoveModal() {
      this.setProperties({
        filesToRemove: null,
        removeParentDir: null,
      });
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
      this.set('selectedFiles', Object.freeze([]));
    },

    actions: {
      containerScrollTop() {
        return this.get('containerScrollTop')(...arguments);
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
        this.closeCreateItemModal();
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
        this.closeRemoveModal();
      },
      openRenameModal(file, parentDir) {
        this.setProperties({
          fileToRename: file,
          renameParentDir: parentDir,
        });
      },
      closeRenameModal() {
        this.closeRenameModal();
      },
      openInfoModal(file) {
        this.set('fileToShowInfo', file);
      },
      closeInfoModal() {
        this.closeInfoModal();
      },
      openMetadataModal(file) {
        this.set('fileToShowMetadata', file);
      },
      closeMetadataModal() {
        this.closeMetadataModal();
      },
      openShareModal(file) {
        this.set('fileToShare', file);
      },
      closeShareModal() {
        this.closeShareModal();
      },
      openEditPermissionsModal(files) {
        this.set('filesToEditPermissions', [...files]);
      },
      closeEditPermissionsModal() {
        this.closeEditPermissionsModal();
      },
      openFileDistributionModal(files) {
        this.set('filesToShowDistribution', [...files]);
      },
      closeFileDistributionModal() {
        this.closeFileDistributionModal();
      },
      openQosModal(files) {
        this.set('filesToShowQos', files);
      },
      closeQosModal() {
        this.closeQosModal();
      },
      changeSelectedFiles(selectedFiles) {
        this.set('selectedFiles', Object.freeze(selectedFiles));
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
    },
  }
);
