// FIXME: jsdoc

import ObjectProxy from '@ember/object/proxy';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';

export default ObjectProxy.extend({
  type: reads('rootFileType'),

  effFile: computed(function effFile() {
    return this;
  }),

  relationEntityId() {
    return this.get('content').relationEntityId(...arguments);
  },

  belongsTo() {
    return this.get('content').belongsTo(...arguments);
  },

  hasMany() {
    return this.get('content').hadMany(...arguments);
  },
});
