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

export default OneEmbeddedComponent.extend(
  ContentSpaceBaseMixin,
  createDataProxyMixin('spaceRootDir'), {
    classNames: ['content-file-browser'],

    store: service(),
    fileManager: service(),

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

    injectedDirGri: computed('dirEntityId', 'spaceEntityId', function injectedDirGri() {
      const {
        spaceEntityId,
        dirEntityId,
      } = this.getProperties('spaceEntityId', 'dirEntityId');
      const isValidDirEntityId = dirEntityId &&
        getSpaceIdFromFileId(dirEntityId) === spaceEntityId;
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
    fetchSpaceRootDir() {
      const {
        injectedDirGri,
        spaceProxy,
        store,
      } = this.getProperties('injectedDirGri', 'spaceProxy', 'store');

      return spaceProxy.then(space => {
        if (injectedDirGri) {
          return store.findRecord('file', injectedDirGri);
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
          filesToRemove: files,
          removeParentDir: parentDir,
        });
      },
      closeRemoveModal() {
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
      openEditPermissionsModal(files) {
        this.set('filesToEditPermissions', files);
      },
      closeEditPermissionsModal() {
        this.set('filesToEditPermissions', null);
      },
      openFileDistributionModal(files) {
        this.set('filesToShowDistribution', files);
      },
      closeFileDistributionModal() {
        this.set('filesToShowDistribution', null);
      },
      updateDirEntityId(dirEntityId) {
        this.callParent('updateDirEntityId', dirEntityId);
      },
      getTransfersUrl({ fileId, tabId }) {
        return this.callParent('getTransfersUrl', { fileId, tabId });
      },
    },
  }
);
