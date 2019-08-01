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

export default OneEmbeddedComponent.extend(
  createDataProxyMixin('spaceRootDir'), {
    classNames: ['content-file-browser'],

    store: service(),
    fileServer: service(),

    /**
     * @override
     */
    iframeInjectedProperties: Object.freeze(['spaceEntityId']),

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
    fetchSpaceRootDir() {
      const {
        store,
        spaceGri,
      } = this.getProperties('store', 'spaceGri');

      return store.findRecord('space', spaceGri)
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
          this.get('fileServer').trigger('dirChildrenRefresh', createItemParentDir);
        }
        this.setProperties({
          createItemParentDir: null,
          createItemType: null,
        });
      },
      openRemoveModal(files) {
        this.set('filesToRemove', files);
      },
      closeRemoveModal(removeInvoked /*, removeResults */ ) {
        // FIXME: refactor here and in modal to use only file-server service
        // for create/remove/rename/refresh operations
        if (removeInvoked) {
          const {
            dir,
            fileServer,
          } = this.getProperties('dir', 'fileServer');
          fileServer.trigger('dirChildrenRefresh', dir);
          // FIXME: use remove results to show if all/some/no files were removed
        }
        this.set('filesToRemove', null);
      },
      openRenameModal(file, parentDir) {
        this.setProperties({
          fileToRename: file,
          renameParentDir: parentDir,
        });
      },
      closeRenameModal(isRenamed, fileId) {
        // FIXME: refactor here and in modal to use only file-server service
        // for create/remove/rename/refresh operations
        const {
          renameParentDir,
          fileServer,
          store,
        } = this.getProperties('renameParentDir', 'fileServer', 'store');
        if (isRenamed) {
          store.findRecord('file', fileId)
            .then(file => file.reload())
            .then(() =>
              fileServer.trigger('dirChildrenRefresh', renameParentDir)
            );
        }
        this.setProperties({
          fileToRename: null,
          renameParentDir: null,
        });
      },
    },
  }
);
