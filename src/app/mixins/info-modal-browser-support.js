/**
 * Adds support of opening/closing file-info-modal in browser containers.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Mixin from '@ember/object/mixin';
import { isArray } from '@ember/array';

export default Mixin.create({
  // required property: browserModel

  /**
   * @type {Array<Models.File>}
   */
  filesToShowInfo: undefined,

  /**
   * @type {FileInfoTabId} activeTab
   */
  showInfoInitialTab: undefined,

  /**
   * @param {Models.File|Array<Models.File>} files
   * @param {FileInfoTabId} activeTab
   */
  openInfoModal(files, activeTab) {
    // we want to see items selected under the info panel
    this.browserModel.changeSelectedItems(files);
    this.setProperties({
      filesToShowInfo: isArray(files) ? files : [files],
      showInfoInitialTab: activeTab || 'general',
    });
  },

  closeInfoModal() {
    this.set('filesToShowInfo', null);
  },
});
