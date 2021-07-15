/**
 * Archive-specific browser table columns.
 *
 * @module components/archive-browser/table-row-columns
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableRowColumns from 'oneprovider-gui/components/file-browser/fb-table-row-columns';
import { promise } from 'ember-awesome-macros';
import { reads } from '@ember/object/computed';
import { get } from '@ember/object';

export default FbTableRowColumns.extend({
  /**
   * @override
   */
  i18nPrefix: 'components.archiveBrowser.tableRowColumns',

  /**
   * Frame name, where Onezone link should be opened
   * @type {String}
   */
  navigateTarget: '_top',

  loadingBaseArchiveProxy: promise.object(promise.all(
    'fileRowModel.baseArchiveHrefProxy',
    'fileRowModel.baseArchiveNameProxy'
  )),

  baseArchiveName: reads('fileRowModel.baseArchiveNameProxy.content'),

  baseArchiveUrl: reads('fileRowModel.baseArchiveHrefProxy.content'),

  actions: {
    async baseArchiveLinkClick(event) {
      event.stopPropagation();
      const currentlySelectedForJump = this.get('browserModel.selectedFilesForJump');
      const baseArchiveId = this.get('fileRowModel.baseArchiveId');
      if (
        get(currentlySelectedForJump, 'length') === 1 &&
        get(currentlySelectedForJump[0], 'entityId') === baseArchiveId
      ) {
        const baseArchive = await this.get('fileRowModel.baseArchiveProxy');
        this.get('browserModel').forceSelectAndJump([baseArchive]);
      }
    },
  },
});
