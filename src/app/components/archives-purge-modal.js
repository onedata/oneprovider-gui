/**
 * Modal-contained archives-purge component. Used in archives browser to purge selected
 * archives.
 *
 * @module components/archives-purge-modal
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default Component.extend({
  /**
   * @virtual
   * @type {Array<Utils.BrowsableArchive>}
   */
  archives: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  onHide: notImplementedIgnore,

  /**
   * @type {Boolean}
   */
  processing: false,

  actions: {
    hide() {
      this.get('onHide')();
    },
  },
});
