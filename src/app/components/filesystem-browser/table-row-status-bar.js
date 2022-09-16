/**
 * Implementation of status part of table row part for filesystem-browser.
 *
 * @module components/filesystem-browser/table-row-status-bar
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

  /**
   * If set to true, tags will not provide actions on click.
   * @type {ComputedProperty<Boolean>}
   */
  disabled: reads('browserModel.disableStatusBar'),

  type: reads('file.type'),

  isSymlink: reads('fileRowModel.isSymlink'),

  hardlinksCount: or('file.hardlinksCount', raw(1)),

  isShared: reads('file.isShared'),

  isOpenDataProxy: promise.object(computed(
    'isShared',
    'file.sharesCount',
    async function isOpenData() {
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
    'file.{type,owner.entityId,posixPermissions}',
    function isForbidden() {
      const {
        file,
        previewMode,
        isSpaceOwned,
      } = this.getProperties('file', 'previewMode', 'isSpaceOwned');
      if (isSpaceOwned) {
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

  hasMetadata: reads('file.hasMetadata'),

  hasAcl: equal('file.activePermissionsType', raw('acl')),
});
