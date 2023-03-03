/**
 * Proxies some notification methods to Onezone's global notify
 *
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { inject as service } from '@ember/service';
import GlobalNotify from 'onedata-gui-common/services/global-notify';

function delegate(methodName) {
  return function (...args) {
    return this.get('appProxy').callParent('callGlobalNotify', methodName, ...args);
  };
}

// Delegating only ember-notify methods to unified notifier
const delegates = [
  'info',
  'success',
  'warning',
].reduce((mixin, methodName) => {
  mixin[methodName] = delegate(methodName);
  return mixin;
}, {});

export default GlobalNotify.extend(delegates, {
  appProxy: service(),
});
