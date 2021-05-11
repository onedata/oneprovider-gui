// FIXME: jsdoc

import Component from '@ember/component';

export default Component.extend({
  classNames: ['empty-dir-box', 'dir-box'],

  /**
   * @virtual
   * @type {Utils.BaseBrowserModel}
   */
  browserModel: undefined,
});
