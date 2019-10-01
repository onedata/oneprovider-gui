/**
 * FIXME: doc; components mixing this should have injected `spaceEntityId`
 * 
 * @module mixins/content-space-base
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Mixin from '@ember/object/mixin';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { computed } from '@ember/object';

export default Mixin.create(
  createDataProxyMixin('space'), {

    /**
     * @virtual
     * @type {Ember.Service}
     */
    store: undefined,

    /**
     * @virtual
     * @type {string}
     */
    spaceEntityId: undefined,

    spaceGri: computed('spaceEntityId', function spaceGri() {
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
  }
);
