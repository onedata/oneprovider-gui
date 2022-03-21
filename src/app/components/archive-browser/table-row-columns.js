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
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import isNewTabRequestEvent from 'onedata-gui-common/utils/is-new-tab-request-event';
import { inject as service } from '@ember/service';

export default FbTableRowColumns.extend({
  parentAppNavigation: service(),
  archiveManager: service(),
  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveBrowser.tableRowColumns',

  /**
   * Frame name, where Onezone link should be opened
   * @type {String}
   */
  navigateTarget: reads('parentAppNavigation.navigateTarget'),

  loadingBaseArchiveProxy: promise.object(promise.all(
    'fileRowModel.baseArchiveHrefProxy',
    'fileRowModel.baseArchiveNameProxy'
  )),

  baseArchiveProxy: reads('fileRowModel.baseArchiveProxy'),

  baseArchiveName: reads('fileRowModel.baseArchiveNameProxy.content'),

  baseArchiveUrl: reads('fileRowModel.baseArchiveHrefProxy.content'),

  baseArchiveId: reads('fileRowModel.baseArchiveId'),

  baseArchiveIsDeleted: computed(
    'baseArchiveProxy.isRejected',
    function baseArchiveIsDeleted() {
      const baseArchiveProxy = this.get('baseArchiveProxy');
      const errorReason = get(baseArchiveProxy, 'reason');
      return errorReason && errorReason.id === 'notFound' || false;
    }
  ),

  stateClassMapping: Object.freeze({
    creating: 'infinite animated pulse-mint',
    succeeded: '',
    failed: 'text-danger',
    destroying: 'infinite animated pulse-orange',
  }),

  async fetchBaseArchive() {
    return await this.get('fileRowModel').updateBaseArchiveProxy();
  },

  actions: {
    async baseArchiveLinkClick(event) {
      event.stopPropagation();
      // intentionally forcing base archive fetch to check if it is reachable
      // (it might be deleted or something in the meantime)
      let baseArchive;
      try {
        baseArchive = await this.fetchBaseArchive();
      } catch (error) {
        this.get('globalNotify').backendError(this.t('gettingBaseArchive'), error);
        event.preventDefault();
        return;
      }
      const isNewTabRequest = isNewTabRequestEvent(event);
      if (!isNewTabRequest) {
        event.preventDefault();
        return this.get('browserModel.fbTableApi').forceSelectAndJump([baseArchive]);
      }
    },
  },
});
