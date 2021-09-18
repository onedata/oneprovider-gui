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
          'component:items-select-browser#contentScroll: tried to compute contentScroll before render'
        );
      }
      if (contentScrollSelector) {
        const customScrollElement = _document.querySelector(contentScrollSelector);
        if (!customScrollElement) {
          console.error(
            'component:items-select-browser#contentScroll: no #{contentScrollSelector} element found, infinite scroll may be broken'
          );
        }
        return customScrollElement;
      }
      let scrollElement = _document.querySelector(`#${modalBodyId} .bs-modal-body-scroll`);
      if (!scrollElement) {
        console.error(
          'component:items-select-browser#contentScroll: no .bs-modal-body-scroll body element found, infinite scroll may be broken'
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
