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
import { computed } from '@ember/object';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { promise } from 'ember-awesome-macros';

// TODO: observer for changing dir that is injected to enable change in runtime

// FIXME: reading cdmiObjectId, distribution etc. should be blocked for root dir - add isVirtual or something

export default OneEmbeddedComponent.extend(
  createDataProxyMixin('share'),
  createDataProxyMixin('rootDir'), {
    classNames: ['content-public-share'],

    shareManager: service(),

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
      return shareId ? shareManager.getShare(shareId, 'public') : null;
    })),

    actions: {
      updateDirId(dirId) {
        return this.callParent('updateDirId', dirId);
      },
    },
  }
);
