/**
 * Container for public share file browser to use in an iframe with injected properties.
 * 
 * @module component/content-public-share
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OneEmbeddedComponent from 'oneprovider-gui/components/one-embedded-component';
import { inject as service } from '@ember/service';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import gri from 'onedata-gui-websocket-client/utils/gri';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import EmberObject, { computed, get } from '@ember/object';
import { getShareIdFromFileId } from 'oneprovider-gui/models/file';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { entityType as shareEntityType } from 'oneprovider-gui/models/share';
import { promise, equal, raw } from 'ember-awesome-macros';
import { resolve, reject } from 'rsvp';

// TODO: observer for changing dir that is injected to enable change in runtime

// FIXME: reading cdmiObjectId, distribution etc. should be blocked for root dir - add isVirtual or something

const ShareRootDir = EmberObject.extend({
  entityId: 'shareRoot',
  type: 'dir',
  secondaryType: 'shareRoot',
  hasParent: false,
  parent: promise.object(raw(resolve(null))),
});

export default OneEmbeddedComponent.extend(
  createDataProxyMixin('share'),
  createDataProxyMixin('rootDir'), {
    classNames: ['content-file-browser'],

    shareManager: service(),
    fileManager: service(),

    /**
     * @virtual optional
     * @type {Function}
     */
    containerScrollTop: notImplementedIgnore,

    /**
     * @override
     */
    iframeInjectedProperties: Object.freeze(['shareId', 'dirId']),

    /**
     * @virtual
     */
    spaceId: undefined,

    /**
     * @virtual optional
     */
    dirId: undefined,

    isInShareRoot: equal('dirProxy.content.secondaryType', raw('shareRoot')),

    generalDataProxy: promise.object(promise.all('rootDirProxy', 'dirProxy')),

    // FIXME: ignore injected dirId if it is not child of selected share
    dirProxy: promise.object(computed('rootDirProxy', function dirProxy() {
      const dirId = this.get('dirId');
      if (dirId) {
        return this.get('fileManager').getFile(dirId);
      } else {
        return this.get('rootDirProxy');
      }
    })),

    init() {
      this._super(...arguments);

      // FIXME: debug
      window.contentPublicShare = this;
    },

    /**
     * @override
     */
    fetchShare() {
      const {
        shareManager,
        shareId,
      } = this.getProperties('shareManager', 'shareId');
      return shareManager.getShare(shareId, 'public');
    },

    /**
     * @override
     */
    fetchRootDir() {
      return this.get('shareProxy').then(share => {
        return ShareRootDir.create({
          name: get(share, 'name'),
        });
      });
    },

    actions: {
      fetchShareRootDirChildren(dirId, startIndex, size, offset, array) {
        if (dirId !== 'shareRoot') {
          return reject('cannot use fetchShareRootDirChildren for non-share-root');
        }
        if (startIndex == null) {
          if (size <= 0 || offset < 0) {
            return resolve([]);
          } else {
            return this.get('shareProxy')
              .then(share => get(share, 'rootFile'))
              .then(rootFile => [rootFile]);
          }
        } else if (startIndex === array.get('sourceArray.lastObject.index')) {
          return resolve([]);
        } else {
          return reject('cannot use fetch file transfer not from start');
        }
      },
      containerScrollTop() {
        return this.get('containerScrollTop')(...arguments);
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
      updateDirId(dirId) {
        this.callParent('updateDirId', dirId);
      },
      getTransfersUrl({ fileId, tabId }) {
        return this.callParent('getTransfersUrl', { fileId, tabId });
      },
    },
  }
);
