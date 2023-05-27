/**
 * Implementation of browser-model (logic and co-related data) for filesystem-browser
 * of shared files.
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FilesystemBrowserModel from './filesystem-browser-model';
import { promise, raw } from 'ember-awesome-macros';
import { resolve } from 'rsvp';
import EmberObject from '@ember/object';
import { LegacyFileType } from 'onedata-gui-common/utils/file';

export default FilesystemBrowserModel.extend({
  /**
   * @virtual
   * @type {Models.Share}
   */
  share: undefined,

  /**
   * @override
   */
  rootIcon: 'share',

  /**
   * @override
   */
  readonlyFilesystem: true,

  /**
   * @override
   */
  fetchDirChildren(dirId, ...fetchArgs) {
    // debugger;
    if (dirId === shareRootId) {
      return this.fetchShareRootDirChildren(dirId, ...fetchArgs);
    } else {
      return this._super(...arguments);
    }
  },

  async fetchShareRootDirChildren(dirId, startIndex, size, offset, array) {
    if (startIndex == null) {
      if (size <= 0 || offset < 0) {
        return createEmptyFetchChildrenResponse();
      } else {
        return this.share.rootFile
          .then(rootFile => ({ childrenRecords: [rootFile], isLast: true }));
      }
    } else if (startIndex === array.get('sourceArray.lastObject.index')) {
      return createEmptyFetchChildrenResponse();
    } else {
      throw new Error(
        'fetchShareRootDirChildren: illegal fetch children for virtual share root dir'
      );
    }
  },
});

export const shareRootId = 'shareRoot';

export const ShareRootDirClass = EmberObject.extend({
  id: shareRootId,
  entityId: shareRootId,
  type: LegacyFileType.Directory,
  isShareRoot: true,
  hasParent: false,
  parent: promise.object(raw(resolve(null))),
  async reload() {
    return this;
  },
});

function createEmptyFetchChildrenResponse() {
  return {
    childrenRecords: [],
    isLast: true,
  };
}
