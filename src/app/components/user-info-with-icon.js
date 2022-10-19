/**
 * Renders user info with icon
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';

export default Component.extend({
  classNames: ['user-info-with-icon'],

  /**
   * @virtual
   * @type {Models.User}
   */
  owner: undefined,
});
