/**
 * Modal which can create a share or show link to it
 * 
 * @module components/file-browser/fb-share-modal
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default Component.extend({
  /**
   * @virtual
   */
  file: undefined,

  /**
   * @virtual
   */
  close: notImplementedReject,

  /**
   * @virtual
   */
  onHidden: notImplementedIgnore,

  open: false,

  actions: {
    close() {
      this.get('close')();
    },
    onHidden() {
      this.get('onHidden')();
    },
  },
});
