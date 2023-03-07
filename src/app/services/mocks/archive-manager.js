/**
 * A mocked version of archive manager to bypass normalization/serialization in adapter.
 * For properties description see non-mocked `services/production/archive-manager`
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import ProductionManager from '../production/archive-manager';
import { all as allFulfilled } from 'rsvp';
import { get } from '@ember/object';
import sleep from 'onedata-gui-common/utils/sleep';

export default ProductionManager.extend({
  /**
   * @override
   */
  pushAttrsToStore(attrs) {
    const store = this.get('store');
    return allFulfilled(attrs.map(attrs =>
      store.findRecord('archive', get(attrs, 'id'))
    ));
  },

  /**
   * @override
   */
  async recallArchive() {
    // for testing long freezed recall calls that should disable file browser
    await sleep(10000);
    return this._super(...arguments);
  },
});
