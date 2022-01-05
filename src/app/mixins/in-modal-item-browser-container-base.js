/**
 * Improves modals support in browser containers that are rendered in modals.
 *
 * @module mixins/in-modal-item-browser-container-base
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Mixin from '@ember/object/mixin';
import { computed } from '@ember/object';

export default Mixin.create({
  _document: window.document,

  isRendered: false,

  contentScroll: computed(
    'isRendered',
    'modalBodyId',
    'contentScrollSelector',
    function contentScroll() {
      const {
        _document,
        isRendered,
        modalBodyId,
        contentScrollSelector,
      } = this.getProperties(
        '_document',
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
        const customScrollElement = _document.querySelector(contentScrollSelector);
        if (!customScrollElement) {
          console.error(
            'mixin:in-modal-item-browser-container-base#contentScroll: no #{contentScrollSelector} element found, infinite scroll may be broken'
          );
        }
        return customScrollElement;
      }
      let scrollElement = _document.querySelector(`#${modalBodyId} .bs-modal-body-scroll`);
      if (!scrollElement) {
        console.error(
          'mixin:in-modal-item-browser-container-base#contentScroll: no .bs-modal-body-scroll body element found, infinite scroll may be broken'
        );
        scrollElement = _document.body;
      }
      return scrollElement;
    }
  ),

  didInsertElement() {
    this._super(...arguments);
    this.set('isRendered', true);
  },
});
