/**
 * Container for public share file browser to use in an iframe with injected properties.
 * 
 * @module component/content-private-share
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OneEmbeddedComponent from 'oneprovider-gui/components/one-embedded-component';
import { inject as service } from '@ember/service';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { computed } from '@ember/object';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { promise } from 'ember-awesome-macros';

// TODO: observer for changing dir that is injected to enable change in runtime

export default OneEmbeddedComponent.extend(
  createDataProxyMixin('share'),
  createDataProxyMixin('rootDir'), {
    classNames: ['content-private-share'],

    shareManager: service(),
    guiContext: service(),

    /**
     * @virtual optional
     * @type {Function}
     */
    containerScrollTop: notImplementedIgnore,

    /**
     * @type {String}
     */
    spaceId: undefined,

    /**
     * @type {String}
     */
    dirId: undefined,

    /**
     * @override
     */
    iframeInjectedProperties: Object.freeze(['shareId', 'dirId']),

    shareProxy: promise.object(computed('shareId', function shareProxy() {
      const {
        shareManager,
        shareId,
      } = this.getProperties('shareManager', 'shareId');
      // FIXME: no such share error (share manager try to get share id and lack of share id)
      return shareId ? shareManager.getShare(shareId, 'private') : null;
    })),

    actions: {
      updateDirId(dirId) {
        return this.callParent('updateDirId', dirId);
      },
      getDataUrl({ spaceId, dirId }) {
        const providerId = this.get('guiContext.clusterId');
        return this.callParent('getDataUrl', { spaceId, dirId, providerId });
      },
    },
  }
);
