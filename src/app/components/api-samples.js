/**
 * Renders api samples content.
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import ApiSamples from 'onedata-gui-common/components/api-samples';

export default ApiSamples.extend({
  appProxy: service(),

  /**
   * @type {String} URL to create access token view
   */
  getAccessTokenUrl: computed(function getAccessTokenUrl() {
    return this.appProxy.callParent('getAccessTokenUrl');
  }),
});
