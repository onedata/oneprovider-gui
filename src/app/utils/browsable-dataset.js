/**
 * Wrapper for dataset model that adds API for browser components.
 * A dataset can be treated then as a file-like object.
 *
 * @module utils/browsable-dataset
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import ObjectProxy from '@ember/object/proxy';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';

export default ObjectProxy.extend({
  type: reads('rootFileType'),

  effFile: computed(function effFile() {
    return this;
  }),

  browsableType: 'dataset',

  relationEntityId: proxyMethod('relationEntityId'),
  belongsTo: proxyMethod('belongsTo'),
  hasMany: proxyMethod('hasMany'),
  save: proxyMethod('save'),
  reload: proxyMethod('reload'),
  destroyRecord: proxyMethod('destroyRecord'),
});

function proxyMethod(methodName) {
  return function () {
    return this.get('content')[methodName](...arguments);
  };
}
