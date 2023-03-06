/**
 * Base for components that have space entity injected and use space as model
 *
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Mixin from '@ember/object/mixin';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { computed } from '@ember/object';
import { entityType as spaceEntityType } from 'oneprovider-gui/models/space';

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
        entityType: spaceEntityType,
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
