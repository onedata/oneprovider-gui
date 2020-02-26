/**
 * Container for file browser to use in an iframe with injected properties.
 * 
 * @module component/content-file-browser
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OneEmbeddedComponent from 'oneprovider-gui/components/one-embedded-component';
import { inject as service } from '@ember/service';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { computed, get } from '@ember/object';
import { getSpaceIdFromFileId } from 'oneprovider-gui/models/file';
import ContentSpaceBaseMixin from 'oneprovider-gui/mixins/content-space-base';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default OneEmbeddedComponent.extend(
  I18n,
  ContentSpaceBaseMixin,
  createDataProxyMixin('dir'), {
    classNames: ['content-file-browser'],

    /**
     * @override
     */
    i18nPrefix: 'components.contentFileBrowser',

    store: service(),
    fileManager: service(),
    globalNotify: service(),

    /**
     * @virtual optional
     * @type {Function}
     */
    containerScrollTop: notImplementedIgnore,

    /**
     * @override
     */
    iframeInjectedProperties: Object.freeze(['spaceEntityId', 'dirEntityId']),

    /**
     * @virtual optional
     */
    dirEntityId: undefined,

    fileToShowInfo: undefined,

    fileToShowMetadata: undefined,

    selectedFiles: Object.freeze([]),

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

    // TODO: observer for changing dir that is injected to enable change in runtime

    /**
     * @override
     */
    fetchDir() {
      const {
        injectedDirGri,
        spaceProxy,
        store,
        globalNotify,
      } = this.getProperties('injectedDirGri', 'spaceProxy', 'store', 'globalNotify');

      return spaceProxy.then(space => {
        if (injectedDirGri) {
          return store.findRecord('file', injectedDirGri)
            .catch(error => {
              globalNotify.backendError(this.t('openingDirectory'), error);
              return get(space, 'rootDir');
            });
        } else {
          return get(space, 'rootDir');
        }
      });
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
      closeCreateItemModal( /* isCreated, submitResult */ ) {
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
        this.setProperties({
          selectedFiles: this.get('filesToRemove')
            .filter(file => newIds.includes(get(file, 'entityId'))),
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
      closeRenameModal() {
        this.setProperties({
          fileToRename: null,
          renameParentDir: null,
        });
      },
      openInfoModal(file) {
        this.set('fileToShowInfo', file);
      },
      closeInfoModal() {
        this.set('fileToShowInfo', null);
      },
      openMetadataModal(file) {
        this.set('fileToShowMetadata', file);
      },
      closeMetadataModal() {
        this.set('fileToShowMetadata', null);
      },
      openShareModal(file) {
        this.set('fileToShare', file);
      },
      closeShareModal() {
        this.set('fileToShare', null);
      },
      openEditPermissionsModal(files) {
        this.set('filesToEditPermissions', [...files]);
      },
      closeEditPermissionsModal() {
        this.set('filesToEditPermissions', null);
      },
      openFileDistributionModal(files) {
        this.set('filesToShowDistribution', [...files]);
      },
      closeFileDistributionModal() {
        this.set('filesToShowDistribution', null);
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
    },
  }
);
