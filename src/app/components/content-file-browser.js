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
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { getSpaceEntityIdFromFileEntityId } from 'oneprovider-gui/models/file';

export default OneEmbeddedComponent.extend(
  createDataProxyMixin('space'),
  createDataProxyMixin('spaceRootDir'), {
    classNames: ['content-file-browser'],

    store: service(),
    fileManager: service(),

    /**
     * @override
     */
    iframeInjectedProperties: Object.freeze(['spaceEntityId', 'dirEntityId']),

    /**
     * @virtual optional
     */
    containerScrollTop: notImplementedIgnore,

    /**
     * @virtual optional
     */
    dirEntityId: undefined,

    spaceGri: computed('spaceEntityId', function spaceGri() {
      return gri({
        entityType: 'op_space',
        entityId: this.get('spaceEntityId'),
        aspect: 'instance',
        scope: 'private',
      });
    }),

    injectedDirGri: computed('dirEntityId', function injectedDirGri() {
      const {
        spaceEntityId,
        dirEntityId,
      } = this.getProperties('spaceEntityId', 'dirEntityId');
      const isValidDirEntityId = dirEntityId &&
        getSpaceEntityIdFromFileEntityId(dirEntityId) === spaceEntityId;
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

    /**
     * @override
     */
    fetchSpace() {
      const {
        store,
        spaceGri,
      } = this.getProperties('store', 'spaceGri');

      return store.findRecord('space', spaceGri);
    },

    // FIXME: observer for changing dir that is injected to enable change in runtime
    /**
     * @override
     */
    fetchSpaceRootDir() {
      const injectedDirGri = this.get('injectedDirGri');
      if (injectedDirGri) {
        return this.get('store')
          .findRecord(
            'file',
            injectedDirGri
          );
      } else {
        return this.get('spaceProxy')
          .then(space => get(space, 'rootDir'));
      }
    },

    actions: {
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
      openRenameModal(file) {
        return get(file, 'parent').then(parentDir => {
          this.setProperties({
            fileToRename: file,
            renameParentDir: parentDir,
          });
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
      containerScrollTop() {
        return this.get('containerScrollTop')(...arguments);
      },
      updateDirEntityId(dirEntityId) {
        this.callParent('updateDirEntityId', dirEntityId);
      },
    },
  }
);
