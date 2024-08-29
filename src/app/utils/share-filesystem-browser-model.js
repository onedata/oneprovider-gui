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
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { LegacyFileType } from 'onedata-gui-common/utils/file';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';
import { actionContext } from 'oneprovider-gui/components/file-browser';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';

export const shareRootId = 'shareRoot';

export default FilesystemBrowserModel.extend({
  globalClipboard: service(),
  fileManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.shareFilesystemBrowserModel',

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
  disabledColumns: Object.freeze(['owner', 'replication', 'qos', 'posixPermissions']),

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

  /**
   * Remember to copy original computed property dependencies.
   * @override
   */
  buttonNames: computed('isLastListLoadErrorFatal', function buttonNames() {
    /** @type {Array<string>} */
    const btnNameList = [...this._super(...arguments)];
    let downloadBtnIndex = btnNameList.indexOf('btnDownload');
    if (downloadBtnIndex === -1) {
      downloadBtnIndex = btnNameList.length - 1;
    }
    btnNameList.splice(downloadBtnIndex + 1, 0, 'btnCopyPublicDownloadUrl');
    return btnNameList;
  }),

  /**
   * @type { boolean }
   */
  hasXattrColumnsSupport: false,

  publicDownloadUrlProxy: computed(
    'selectedItems.[]',
    function publicDownloadUrlProxy() {
      const selectedItem = this.selectedItems?.length === 1 ?
        this.selectedItems[0] : null;
      return promiseObject((async () => {
        if (!selectedItem) {
          return;
        }
        const fileId = get(selectedItem, 'entityId');
        const apiSamples = await this.fileManager.getFileApiSamples(
          fileId,
          'public'
        );
        const sample = apiSamples?.find(sample =>
          sample.swaggerOperationId === 'get_shared_data'
        );
        return sample && (sample.apiRoot + sample.path);
      })());
    }
  ),

  publicDownloadUrl: reads('publicDownloadUrlProxy.content'),

  btnCopyPublicDownloadUrl: computed(
    'publicDownloadUrlProxy.{isRejected,isPending}',
    'publicDownloadUrl',
    function btnCopyPublicDownloadUrl() {
      let tip;
      if (!this.publicDownloadUrl) {
        if (get(this.publicDownloadUrlProxy, 'isRejected')) {
          tip = this.t('btnCopyPublicDownloadUrlTip.rejected');
        } else if (get(this.publicDownloadUrlProxy, 'isPending')) {
          tip = this.t('btnCopyPublicDownloadUrlTip.pending');
        } else {
          tip = this.t('btnCopyPublicDownloadUrlTip.empty');
        }
      }
      return this.createItemBrowserAction({
        id: 'copyPublicDownloadUrl',
        icon: 'browser-copy',
        disabled: !this.publicDownloadUrl,
        tip,
        action: ( /* files */ ) => {
          return this.globalClipboard.copy(this.publicDownloadUrl);
        },
        showIn: [
          actionContext.singleDirPreview,
          actionContext.singleFilePreview,
        ],
      });
    }
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
