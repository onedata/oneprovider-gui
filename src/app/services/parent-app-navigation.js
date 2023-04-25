/**
 * Provides methods for navigating the master application.
 * Currently it could be only a Onezone app (unified GUI).
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service from '@ember/service';
import globals from 'onedata-gui-common/utils/globals';

export default Service.extend({
  navigateTarget: '_top',

  openUrl(url, replace = false) {
    if (replace) {
      globals.window.top.location.replace(url);
    } else {
      globals.window.open(url, this.navigateTarget);
    }
  },
});
