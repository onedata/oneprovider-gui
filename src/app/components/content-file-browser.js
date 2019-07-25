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
      toggleCreateItemModal(open, itemType, parentDir) {
        if (open) {
          this.setProperties({
            createItemParentDir: parentDir,
            itemType,
          });
        } else {
          this.setProperties({
            createItemParentDir: null,
            itemType: null,
          });
        }
      },
    },
  }
);
