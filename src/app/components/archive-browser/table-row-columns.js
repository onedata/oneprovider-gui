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
import isNewTabRequestEvent from 'onedata-gui-common/utils/is-new-tab-request-event';
import { inject as service } from '@ember/service';

export default FbTableRowColumns.extend({
  onedataNavigation: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveBrowser.tableRowColumns',

  /**
   * Frame name, where Onezone link should be opened
   * @type {String}
   */
  navigateTarget: reads('onedataNavigation.navigateTarget'),

  loadingBaseArchiveProxy: promise.object(promise.all(
    'fileRowModel.baseArchiveHrefProxy',
    'fileRowModel.baseArchiveNameProxy'
  )),

  baseArchiveName: reads('fileRowModel.baseArchiveNameProxy.content'),

  baseArchiveUrl: reads('fileRowModel.baseArchiveHrefProxy.content'),

  actions: {
    async baseArchiveLinkClick(event) {
      event.stopPropagation();
      const isNewTabRequest = isNewTabRequestEvent(event);
      if (!isNewTabRequest) {
        event.preventDefault();
        const baseArchive = await this.get('fileRowModel.baseArchiveProxy');
        return this.get('browserModel.fbTableApi').forceSelectAndJump([baseArchive]);
      }
    },
  },
});
