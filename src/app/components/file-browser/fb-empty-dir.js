/**
 * Base implementation of empty dir view in browser table
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';

export default Component.extend({
  classNames: ['empty-dir-box', 'dir-box'],

  /**
   * @virtual
   * @type {Utils.BaseBrowserModel}
   */
  browserModel: undefined,
});
