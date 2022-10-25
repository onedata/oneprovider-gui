/**
 * Renders table cell with user info
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';

export default Component.extend({
  classNames: ['table-cell-user-info'],

  /**
   * @virtual
   * @type {Models.User}
   */
  owner: undefined,

  userInfoOpened: false,

  actions: {
    toggleUserInfo() {
      this.toggleProperty('userInfoOpened');
    },
  },
});
