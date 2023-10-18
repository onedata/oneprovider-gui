/**
 * Base wrapper for various models that adds API for browser components.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import ObjectProxy from '@ember/object/proxy';

export default ObjectProxy.extend({
  // virtual: type: String, one of: file, dir, symlink

  getRelation: proxyMethod('getRelation'),
  relationEntityId: proxyMethod('relationEntityId'),
  belongsTo: proxyMethod('belongsTo'),
  hasMany: proxyMethod('hasMany'),
  save: proxyMethod('save'),
  reload: proxyMethod('reload'),
  destroyRecord: proxyMethod('destroyRecord'),
  rollbackAttributes: proxyMethod('rollbackAttributes'),

  unloadRecord() {
    proxyMethod('unloadRecord').bind(this)();
    // invalidating record from store causes errors when its a content of proxy,
    // so treat unloading record as end of proxy instance life
    this.set('content', null);
  },
});

// TODO: VFS-7643 redundancy: maybe create util, and mixin/class for browsable model
function proxyMethod(methodName) {
  return function () {
    return this.get('content')[methodName](...arguments);
  };
}
