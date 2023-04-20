/**
 * Improves modals support in browser containers that are rendered in modals.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Mixin from '@ember/object/mixin';
import { computed } from '@ember/object';
import globals from 'onedata-gui-common/utils/globals';

export default Mixin.create({
  isRendered: false,

  contentScroll: computed(
    'isRendered',
    'modalBodyId',
    'contentScrollSelector',
    function contentScroll() {
      const {
        isRendered,
        modalBodyId,
        contentScrollSelector,
      } = this.getProperties(
        'isRendered',
        'modalBodyId',
        'contentScrollSelector'
      );
      if (!isRendered) {
        console.debug(
          'mixin:in-modal-item-browser-container-base#contentScroll: tried to compute contentScroll before render'
        );
      }
      if (contentScrollSelector) {
        const customScrollElement = globals.document.querySelector(contentScrollSelector);
        if (!customScrollElement) {
          console.error(
            'mixin:in-modal-item-browser-container-base#contentScroll: no #{contentScrollSelector} element found, infinite scroll may be broken'
          );
        }
        return customScrollElement;
      }
      let scrollElement = globals.document.querySelector(`#${modalBodyId} .bs-modal-body-scroll`);
      if (!scrollElement) {
        console.error(
          'mixin:in-modal-item-browser-container-base#contentScroll: no .bs-modal-body-scroll body element found, infinite scroll may be broken'
        );
        scrollElement = globals.document.body;
      }
      return scrollElement;
    }
  ),

  didInsertElement() {
    this._super(...arguments);
    this.set('isRendered', true);
  },
});
