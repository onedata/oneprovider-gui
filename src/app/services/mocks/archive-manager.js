/**
 * A mocked version of archive manager to bypass normalization/serialization in adapter.
 * For properties description see non-mocked `services/production/archive-manager`
 *
 * @module services/mocks/archive-manager
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import ProductionManager from '../production/archive-manager';
import { all as allFulfilled } from 'rsvp';
import { get } from '@ember/object';

export default ProductionManager.extend({
  /**
   * @override
   */
  pushChildrenAttrsToStore(childrenAttrs) {
    const store = this.get('store');
    return allFulfilled(childrenAttrs.map(attrs =>
      store.findRecord('archive', get(attrs, 'id'))
    ));
  },
});
