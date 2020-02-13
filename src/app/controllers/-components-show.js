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

const scrollOnTopClass = 'scroll-on-top';

export default Controller.extend({
  scrollState: service(),

  /**
   * @type {Object} with fields: `componentId: string` - name of component to render
   */
  model: undefined,

  actions: {
    /**
     * @param {Event} scrollEvent 
     * @returns {undefined}
     */
    scrollOccurred(scrollEvent) {
      const scrollIsOnTop = scrollEvent.target.scrollTop === 0;
      const $embeddedContent = $('.embedded-content');
      if (scrollIsOnTop) {
        $embeddedContent.addClass(scrollOnTopClass);
      } else {
        $embeddedContent.removeClass(scrollOnTopClass);
      }
      this.get('scrollState').scrollOccurred(scrollEvent);
    },
  },
});
