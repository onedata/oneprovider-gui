/**
 * Proxy service to Onezone's global notify - displays notifications in Onezone frame
 * 
 * @module services/global-notify
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';

function delegate(methodName) {
  return function (...args) {
    return this.get('appProxy').callParent('callGlobalNotify', methodName, ...args);
  };
}

const delegates = [
  'info',
  'success',
  'warning',
  'error',
  'warningAlert',
  'errorAlert',
  'backendError',
].reduce((mixin, methodName) => {
  mixin[methodName] = delegate(methodName);
  return mixin;
}, {});

export default Service.extend(delegates, {
  appProxy: service(),
});
