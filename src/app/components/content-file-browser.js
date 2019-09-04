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

export default OneEmbeddedComponent.extend(
  createDataProxyMixin('space'),
  createDataProxyMixin('spaceRootDir'), {
    classNames: ['content-file-browser'],

    store: service(),
    fileManager: service(),

    /**
     * @override
     */
    iframeInjectedProperties: Object.freeze(['spaceEntityId']),

    /**
     * @virtual optional
     */
    containerScrollTop: notImplementedIgnore,

    spaceGri: computed(function spaceGri() {
      return gri({
        entityType: 'op_space',
        entityId: this.get('spaceEntityId'),
        aspect: 'instance',
        scope: 'private',
      });
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

    /**
     * @override
     */
    fetchSpaceRootDir() {
      return this.get('spaceProxy')
        .then(space => get(space, 'rootDir'));
    },

    actions: {
      openCreateItemModal(itemType, parentDir) {
        this.setProperties({
          createItemParentDir: parentDir,
          createItemType: itemType,
        });
      },
      closeCreateItemModal(isCreated /*, submitResult */ ) {
        const createItemParentDir = this.get('createItemParentDir');
        if (isCreated) {
          this.get('fileManager').trigger(
            'dirChildrenRefresh',
            get(createItemParentDir, 'entityId')
          );
        }
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
      closeRemoveModal(removeInvoked /*, removeResults*/ ) {
        if (removeInvoked) {
          const {
            removeParentDir,
            fileManager,
          } = this.getProperties('removeParentDir', 'fileManager');
          fileManager.trigger('dirChildrenRefresh', get(removeParentDir, 'entityId'));
        }
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
      closeRenameModal(isRenamed, fileId) {
        // FIXME: refactor here and in modal to use only file-manager service
        // for create/remove/rename/refresh operations
        const {
          renameParentDir,
          fileManager,
          store,
        } = this.getProperties('renameParentDir', 'fileManager', 'store');
        if (isRenamed) {
          store.findRecord('file', fileId)
            .then(file => file.reload())
            .then(() =>
              fileManager.trigger('dirChildrenRefresh', get(renameParentDir, 'entityId'))
            );
        }
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
      containerScrollTop() {
        return this.get('containerScrollTop')(...arguments);
      },
    },
  }
);
