/**
 * Allows to notify about scroll events
 * 
 * @module controllers/onedata/components/show
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import $ from 'jquery';

export default Controller.extend({
  scrollState: service(),

  actions: {
    /**
     * @param {Event} scrollEvent 
     * @returns {undefined}
     */
    scrollOccurred(scrollEvent) {
      const scrollOnTop = scrollEvent.target.scrollTop === 0;
      $('.embedded-content')[`${scrollOnTop ? 'add' : 'remove'}Class`]('scroll-on-top');
      this.get('scrollState').scrollOccurred(scrollEvent);
    },
  },
});
