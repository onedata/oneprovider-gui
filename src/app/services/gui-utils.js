/**
 * Provides data and implementation of utils specific for oneprovider-gui
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import GuiUtils from 'onedata-gui-common/services/gui-utils';
import modelRoutableId from 'oneprovider-gui/utils/model-routable-id';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';

export default GuiUtils.extend({
  onedataConnection: service(),

  /**
   * @override
   */
  globalTimeSecondsOffset: reads('onedataConnection.globalTimeSecondsOffset'),

  /**
   * @override
   */
  softwareVersionDetails: computed(
    'onedataConnection.{serviceVersion,serviceBuildVersion}',
    function softwareVersionDetails() {
      return {
        serviceVersion: this.onedataConnection.serviceVersion,
        serviceBuildVersion: this.onedataConnection.serviceBuildVersion,
      };
    },
  ),

  /**
   * @override
   */
  getRoutableIdFor(model) {
    return modelRoutableId(model);
  },
});
