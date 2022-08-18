// FIXME: one-head

import Mixin from '@ember/object/mixin';
import { isArray } from '@ember/array';

export default Mixin.create({
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
    this.setProperties({
      filesToShowInfo: isArray(files) ? files : [files],
      showInfoInitialTab: activeTab || 'general',
    });
  },

  closeInfoModal() {
    this.set('filesToShowInfo', null);
  },
});
