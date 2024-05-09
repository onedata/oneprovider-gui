/**
 * Row of file browser table header (thead)
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableHeadRow from '../file-browser/fb-table-head-row';
import layout from 'oneprovider-gui/templates/components/file-browser/fb-table-head-row';

export default FbTableHeadRow.extend({
  layout,

  actions: {
    checkboxDragStart() {
      this._super(...arguments);
      this.browserModel.disableUploadArea();
    },
    checkboxDragEnd() {
      this._super(...arguments);
      this.browserModel.enableUploadArea();
    },
    headingDragAction(columnName, event) {
      if (!this.browserModel.readonlyFilesystem) {
        this.browserModel.disableUploadArea();
      }
      event.dataTransfer.setData('text', columnName);

      this.set('isDropBorderShown', true);
    },
    headingDragEndAction() {
      if (!this.browserModel.readonlyFilesystem) {
        this.browserModel.enableUploadArea();
      }
      this.set('isDropBorderShown', false);
    },
  },
});
