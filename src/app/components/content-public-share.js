/**
 * Container for public share file browser to use in an iframe with injected properties.
 * 
 * @module component/content-public-share
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OneEmbeddedComponent from 'oneprovider-gui/components/one-embedded-component';
import { inject as service } from '@ember/service';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { computed } from '@ember/object';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { promise } from 'ember-awesome-macros';
import { tag, eq, raw } from 'ember-awesome-macros';

export default OneEmbeddedComponent.extend(
  createDataProxyMixin('share'),
  createDataProxyMixin('rootDir'), {
    classNameBindings: ['contentComponentClass'],

    shareManager: service(),

    /**
     * @virtual optional
     * @type {Function}
     */
    containerScrollTop: notImplementedIgnore,

    contentComponentClass: tag `content-${'scope'}-share`,

    notImplementedIgnore,

    /**
     * One of: public, private
     * @type {String}
     */
    scope: 'public',

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

    /**
     * Public view can be turned into private by setting scope
     * @type {ComputedProperty<boolean>}
     */
    isPrivate: eq('scope', raw('private')),

    shareProxy: promise.object(computed('shareId', function shareProxy() {
      const {
        shareManager,
        shareId,
        scope,
      } = this.getProperties('shareManager', 'shareId', 'scope');
      return shareId ? shareManager.getShare(shareId, scope) : null;
    })),

    actions: {
      updateDirId(dirId) {
        return this.callParent('updateDirId', dirId);
      },
    },
  }
);