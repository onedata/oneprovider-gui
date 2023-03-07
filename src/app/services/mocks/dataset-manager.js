/**
 * A mocked version of dataset manager to bypass normalization/serialization in adapter.
 * For properties description see non-mocked `services/production/dataset-manager`
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import ProductionDatasetManager from '../production/dataset-manager';
import { all as allFulfilled } from 'rsvp';
import { get } from '@ember/object';

export default ProductionDatasetManager.extend({
  /**
   * @override
   */
  pushChildrenAttrsToStore(childrenAttrs) {
    const store = this.get('store');
    return allFulfilled(childrenAttrs.map(attrs =>
      store.findRecord('dataset', get(attrs, 'id'))
    ));
  },
});
