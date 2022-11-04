/**
 * Renders table cell with owner info
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';

export default Component.extend({
  classNames: ['table-cell-owner-info'],

  /**
   * @virtual
   * @type {Models.User}
   */
  owner: undefined,

  /**
   * @type {Boolean}
   */
  userInfoOpened: false,

  /**
   * @type {Boolean}
   */
  isUnderline: false,

  actions: {
    toggleUserInfo() {
      this.toggleProperty('userInfoOpened');
    },

    changeIconHover(hasUnderline) {
      this.set('hasUnderline', hasUnderline);
    },
  },
});
