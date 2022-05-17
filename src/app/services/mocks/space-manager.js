/**
 * A mocked version of space manager to bypass normalization/serialization in adapter.
 * For properties description see non-mocked `services/production/space-manager`
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import ProductionManager from '../production/space-manager';
import { resolve } from 'rsvp';

export default ProductionManager.extend({
  /**
   * @override
   */
  fetchDirSizeStatsConfig() {
    return resolve({ statsCollectionStatus: 'enabled' });
  },
});
