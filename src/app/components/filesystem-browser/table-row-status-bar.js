/**
 * Implementation of status part of table row part for filesystem-browser.
 *
 * All file requirements are managed by FilesystemBrowserModel (`browserModel`).
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableRowStatusBar from 'oneprovider-gui/components/file-browser/fb-table-row-status-bar';
import { equal, raw, or, promise } from 'ember-awesome-macros';
import { get, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import { inject as service } from '@ember/service';
import isPosixViewForbidden from 'oneprovider-gui/utils/is-posix-view-forbidden';

export default FbTableRowStatusBar.extend({
  classNames: ['filesystem-table-row-status-bar'],

  currentUser: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.filesystemBrowser.tableRowStatusBar',

  type: reads('file.type'),

  isSymlink: reads('fileRowModel.isSymlink'),

  hardlinkCount: or('file.hardlinkCount', raw(1)),

  isShared: reads('file.isShared'),

  isOpenDataProxy: promise.object(computed(
    'isShared',
    'file.shareRecords.@each.hasHandle',
    async function isOpenDataProxy() {
      if (!this.isShared) {
        return null;
      }
      const file = this.file;
      try {
        const shareRecords = await get(file, 'shareRecords');
        return shareRecords.isAny('hasHandle');
      } catch (error) {
        console.error(
          `cannot resolve handle service info for file share records; file ID: ${file.entityId}`,
          error
        );
        return null;
      }
    }
  )),

  isOpenData: reads('isOpenDataProxy.content'),

  typeText: computed('type', function typeText() {
    const type = this.get('type');
    if (type) {
      return this.t('fileType.' + type);
    }
  }),

  isForbidden: computed(
    'previewMode',
    'isSpaceOwned',
    'file.{type,owner.entityId,posixPermissions,activePermissionsType}',
    function isForbidden() {
      const {
        file,
        previewMode,
        isSpaceOwned,
      } = this.getProperties('file', 'previewMode', 'isSpaceOwned');
      if (isSpaceOwned || get(file, 'activePermissionsType') === 'acl') {
        return false;
      }

      const posixPermissions = get(file, 'posixPermissions');
      if (!posixPermissions) {
        return false;
      }
      let octalNumber;
      if (previewMode) {
        octalNumber = 2;
      } else {
        const fileOwnerGri = file.belongsTo('owner').id();
        const fileOwnerId = fileOwnerGri ? parseGri(fileOwnerGri).entityId : null;
        if (fileOwnerId === this.get('currentUser.userId')) {
          octalNumber = 0;
        } else {
          octalNumber = 1;
        }
      }
      return isPosixViewForbidden(file, octalNumber);
    }
  ),

  hasCustomMetadata: reads('file.hasCustomMetadata'),

  hasAcl: equal('file.activePermissionsType', raw('acl')),

  actions: {
    /**
     * @param {Models.File} file
     */
    handleShareBadgeClick(file) {
      if (get(file, 'isShared')) {
        this.invokeFileAction(file, 'info', 'shares');
      } else {
        this.invokeFileAction(file, 'share');
      }
    },

    /**
     * @param {Models.File} file
     */
    handleMetadataBadgeClick(file) {
      this.invokeFileAction(file, 'info', 'metadata');
    },

    /**
     * @param {Models.File} file
     */
    handleAclBadgeClick(file) {
      this.invokeFileAction(file, 'info', 'permissions');
    },
  },
});
