/**
 * A mocked version of workflow manager to bypass normalization/serialization in adapter.
 * For properties description see non-mocked `services/production/workflow-manager`
 *
 * @module services/mocks/workflow-manager
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import ProductionFileManager from '../production/workflow-manager';
import { all as allFulfilled } from 'rsvp';
import { get } from '@ember/object';

export default ProductionFileManager.extend({
  /**
   * @override
   */
  async pushAtmWorkflowExecutionsToStore(atmWorkflowExecutionsAttrs) {
    const store = this.get('store');
    return await allFulfilled(atmWorkflowExecutionsAttrs.map(attrs =>
      store.findRecord('atmWorkflowExecution', get(attrs, 'id'))
    ));
  },
});
