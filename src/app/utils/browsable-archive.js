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
import { dateFormat } from 'onedata-gui-common/helpers/date-format';

export default ObjectProxy.extend({
  descriptionMaxLength: 32,

  type: 'dir',

  name: computed('content.{description,creationTime}', function name() {
    const creationTime = this.get('content.creationTime');
    const description = this.get('content.description');
    const descriptionMaxLength = this.get('descriptionMaxLength');
    const dateString = dateFormat([creationTime], {
      format: 'dateWithMinutes',
      blank: '—',
    });
    if (description) {
      let shortDescription;
      if (description.length > descriptionMaxLength) {
        shortDescription = description.slice(0, descriptionMaxLength) + '…';
      } else {
        shortDescription = description;
      }
      return `${dateString} — ${shortDescription}`;
    } else {
      return dateString;
    }
  }),

  effFile: computed(function effFile() {
    return this;
  }),

  browsableType: 'archive',

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
