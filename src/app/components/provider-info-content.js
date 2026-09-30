/**
 * Content of popup with information about provider
 *
 * @author Agnieszka Raczek
 * @copyright (C) 2026: Onedata (onedata.org)
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import ProviderInfoContent from 'onedata-gui-common/components/provider-info-content';

export default ProviderInfoContent.extend({
  providerManager: service(),

  /**
   * @override
   */
  currentProviderId: computed(function currentProviderId() {
    return this.providerManager.getCurrentProviderId();
  }),
});
