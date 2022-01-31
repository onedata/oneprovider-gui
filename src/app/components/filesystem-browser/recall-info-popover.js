// FIXME: documentation

import Component from '@ember/component';
import { computed } from '@ember/object';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default Component.extend({
  onChangeOpened: notImplementedIgnore,
  triggerSelector: undefined,
  opened: false,

  isInModal: computed('element', function isInModal() {
    /** @type {JQuery} */
    const $element = this.$();
    if (!$element) {
      return;
    }

    return $element.parent('.modal').length;
  }),

  actions: {
    changeOpened(openedState) {
      this.get('onChangeOpened')(openedState);
    },
  },
});
