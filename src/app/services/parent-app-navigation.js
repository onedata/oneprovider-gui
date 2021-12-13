/**
 * Provides methods for navigating the master application.
 * Currently it could be only a Onezone app (unified GUI).
 *
 * @module services/parent-app-navigation
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service from '@ember/service';

export default Service.extend({
  _window: window,

  navigateTarget: '_top',

  openUrl(url, replace = false) {
    const {
      _window,
      navigateTarget,
    } = this.getProperties('_window', 'navigateTarget');
    if (replace) {
      _window.top.location.replace(url);
    } else {
      _window.open(url, navigateTarget);
    }
  },
});
