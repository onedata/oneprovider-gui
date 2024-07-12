/**
 * Implementation of browser-model (logic and co-related data) for filesystem-browser
 * of shared files.
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FilesystemBrowserModel from './filesystem-browser-model';
import { promise, raw, eq } from 'ember-awesome-macros';
import { resolve } from 'rsvp';
import EmberObject, { computed, get } from '@ember/object';
import { LegacyFileType } from 'onedata-gui-common/utils/file';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';

export const shareRootId = 'shareRoot';

export default FilesystemBrowserModel.extend({
  /**
   * @virtual
   * @type {Models.Share}
   */
  share: undefined,

  /**
   * @override
   */
  rootIcon: 'browser-share',

  /**
   * @override
   */
  readonlyFilesystem: true,

  /**
   * @override
   */
  isDirStatsFeatureHidden: true,

  /**
   * @override
   */
  disabledColumns: Object.freeze(['owner', 'replication', 'qos']),

  /**
   * @override
   */
  browserPersistedConfigurationKey: 'shareFilesystem',

  /**
   * @override
   */
  isUsingUploadArea: false,

  /**
   * @override
   */
  headRowComponentName: '',

  /**
   * @override
   */
  previewMode: true,

  /**
   * @override
   */
  listingRequirement: computed(
    'dir',
    'listedFilesProperties',
    'rootFileGri',
    'isInVirtualShareDir',
    function listingRequirement() {
      if (this.isInVirtualShareDir) {
        return new FileRequirement({
          properties: this.listedFilesProperties,
          fileGri: this.rootFileGri,
        });
      } else {
        return this._super(...arguments);
      }
    }
  ),

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  usedFileGris: computed(
    'dir',
    'itemsArray.sourceArray.[]',
    'isInVirtualShareDir',
    'rootFileGri',
    function usedFileGris() {
      if (this.isInVirtualShareDir) {
        return this.rootFileGri ? [this.rootFileGri] : [];
      } else {
        return this._super(...arguments);
      }
    },
  ),

  isInVirtualShareDir: eq('dir.entityId', raw(shareRootId)),

  rootFileGri: computed('share', function rootFileGri() {
    return this.share.belongsTo('rootFile').id();
  }),

  /**
   * @override
   */
  fetchDirChildren(dirId, ...fetchArgs) {
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
        const rootFile = await get(this.share, 'rootFile');
        return { childrenRecords: [rootFile], isLast: true };
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

export const ShareRootDirClass = EmberObject.extend({
  /** @virtual {string} */
  name: undefined,
  /** @virtual {string} */
  shareRootId: undefined,

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
