/**
 * Allows to notify about scroll events
 * 
 * @module controllers/onedata/components/show
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Controller.extend({
  scrollState: service(),

  // FIXME: debug code, to remove on final integration
  originInfo: computed(function originInfo() {
    const m = /https:\/\/.*?\/opw\/(.*?)\/.*/.exec(location.href);
    return m && `Cluster ID: ${m[1]}`;
  }),

  actions: {
    scrollOccurred(scrollEvent) {
      this.get('scrollState').scrollOccurred(scrollEvent);
    },
  },
});
