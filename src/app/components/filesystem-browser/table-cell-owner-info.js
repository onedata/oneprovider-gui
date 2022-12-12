/**
 * Renders table cell with owner info
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads } from '@ember/object/computed';

export default Component.extend({
  classNames: ['table-cell-owner-info'],

  /**
   * @virtual
   * @type {ComputedProperty<PromiseObject<Models.User>>}
   */
  ownerProxy: undefined,

  /**
   * @type {Models.User}
   */
  owner: reads('ownerProxy.content'),

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
