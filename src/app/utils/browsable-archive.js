/**
 * Wrapper for archive model that adds API for browser components.
 * An archive can be treated then as a file-like object.
 *
 * @module utils/browsable-archive
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import ObjectProxy from '@ember/object/proxy';
import { computed } from '@ember/object';
import { or } from 'ember-awesome-macros';

export default ObjectProxy.extend({
  type: 'file',

  name: or('content.description', 'content.creationTime'),

  effFile: computed(function effFile() {
    return this;
  }),

  relationEntityId: proxyMethod('relationEntityId'),
  belongsTo: proxyMethod('belongsTo'),
  hasMany: proxyMethod('hasMany'),
  save: proxyMethod('save'),
  reload: proxyMethod('reload'),
  destroyRecord: proxyMethod('destroyRecord'),
});

// TODO: VFS-7643 redundancy: maybe create util, and mixin/class for browsable model
function proxyMethod(methodName) {
  return function () {
    return this.get('content')[methodName](...arguments);
  };
}
