/**
 * Content for "files" tab for single share
 *
 * @module components/share-show/pane-files
 * @author Jakub Liput
 * @copyright (C) 2020-2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import EmberObject, { computed, get } from '@ember/object';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import {
  promise,
  bool,
  raw,
} from 'ember-awesome-macros';
import { resolve, reject } from 'rsvp';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import FilesystemBrowserModel from 'oneprovider-gui/utils/filesystem-browser-model';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';

const shareRootId = 'shareRoot';

const ShareRootDir = EmberObject.extend({
  id: shareRootId,
  entityId: shareRootId,
  type: 'dir',
  isShareRoot: true,
  hasParent: false,
  parent: promise.object(raw(resolve(null))),
});

export default Component.extend(I18n, {
  classNames: ['share-show-pane-files', 'pane-files'],

  fileManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.shareShow.paneFiles',

  /**
   * @virtual
   */
  share: undefined,

  /**
   * @virtual
   */
  dirId: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  updateDirId: notImplementedThrow,

  /**
   * @virtual optional
   * @type {Function}
   */
  containerScrollTop: notImplementedIgnore,

  /**
   * @virtual
   * @type {Function}
   */
  getDataUrl: notImplementedThrow,

  /**
   * @virtual
   * @type {Boolean}
   */
  shareRootDeleted: false,

  //#region browser items for various modals

  fileToShowInfo: null,

  fileToShowMetadata: null,

  fileForConfirmDownload: null,

  //#endregion

  /**
   * @type {Array<Models.File>}
   */
  selectedFiles: undefined,

  isInShareRoot: bool('dirProxy.content.isShareRoot'),

  initialDirProxy: promise.object(computed('share', function initialDirProxy() {
    return this.get('dirProxy');
  })),

  requiredDataProxy: promise.object(promise.all(
    'initialDirProxy',
    'share.rootFile'
  )),

  dirProxy: promise.object(computed('rootDir', 'dirId', function dirProxy() {
    const {
      fileManager,
      dirId,
      rootDir,
    } = this.getProperties('fileManager', 'dirId', 'rootDir');
    if (dirId) {
      return fileManager.getFileById(dirId, 'public')
        .then(file => this.isChildOfShare(file)
          .then(isChildOfShare => resolve(isChildOfShare ? file : rootDir))
        );
    } else {
      return resolve(rootDir);
    }
  })),

  dir: computedLastProxyContent('dirProxy'),

  rootDir: computed('share.{name,entityId}', function rootDir() {
    return ShareRootDir.create({
      name: this.get('share.name'),
      shareRootId: this.get('share.entityId'),
    });
  }),

  init() {
    this._super(...arguments);
    if (!this.get('selectedFiles')) {
      this.set('selectedFiles', []);
    }
    this.set('browserModel', this.createBrowserModel());
  },

  async getItemById(itemId) {
    if (itemId === shareRootId) {
      return this.get('rootDir');
    } else {
      return this.get('fileManager').getFileById(itemId, 'public');
    }
  },

  createBrowserModel() {
    return FilesystemBrowserModel.create({
      ownerSource: this,
      rootIcon: 'share',
      openInfo: this.openInfoModal.bind(this),
      openMetadata: this.openMetadataModal.bind(this),
    });
  },

  openInfoModal(file) {
    this.set('fileToShowInfo', file);
  },

  closeInfoModal() {
    this.set('fileToShowInfo', null);
  },

  openMetadataModal(file) {
    this.set('fileToShowMetadata', file);
  },

  closeMetadataModal() {
    this.set('fileToShowMetadata', null);
  },

  closeConfirmFileDownload() {
    this.set('fileForConfirmDownload', null);
  },

  confirmFileDownload() {
    return this.get('browserModel')
      .downloadFiles([
        this.get('fileForConfirmDownload'),
      ])
      .finally(() => {
        safeExec(this, 'set', 'fileForConfirmDownload', null);
      });
  },

  isChildOfShare(file) {
    return this.get('share.rootFile').then(shareRootFile => {
      const rootInternalId = get(shareRootFile, 'internalFileId');
      return checkOnPath(
        file,
        (currentFile) => get(currentFile, 'internalFileId') === rootInternalId);
    });
  },

  getEmptyFetchChildrenResponse() {
    return {
      childrenRecords: [],
      isLast: true,
    };
  },

  actions: {
    containerScrollTop() {
      return this.get('containerScrollTop')(...arguments);
    },
    fetchShareRootDirChildren(dirId, startIndex, size, offset, array) {
      if (dirId !== shareRootId) {
        return reject('cannot use fetchShareRootDirChildren for non-share-root');
      }
      if (startIndex == null) {
        if (size <= 0 || offset < 0) {
          return resolve(this.getEmptyFetchChildrenResponse());
        } else {
          return this.get('share.rootFile')
            .then(rootFile => ({ childrenRecords: [rootFile], isLast: true }));
        }
      } else if (startIndex === array.get('sourceArray.lastObject.index')) {
        return resolve(this.getEmptyFetchChildrenResponse());
      } else {
        return reject(
          'component:share-show/pane-files#fetchShareRootDirChildren guard: illegal fetch children for virtual share root dir'
        );
      }
    },
    updateDirId(dirId) {
      return this.get('updateDirId')(dirId === shareRootId ? null : dirId);
    },
    resolveFileParentFun(file) {
      if (get(file, 'entityId') === shareRootId) {
        return resolve(null);
      } else if (
        get(file, 'internalFileId') === this.get('share.rootFile.internalFileId')
      ) {
        return resolve(this.get('rootDir'));
      } else {
        return get(file, 'parent');
      }
    },
  },
});

function checkOnPath(file, condition = () => false) {
  if (file) {
    if (condition(file)) {
      return resolve(true);
    } else {
      const parentId = file.belongsTo('parent').id();
      if (parentId) {
        return get(file, 'parent').then(parent => checkOnPath(parent, condition));
      } else {
        return resolve(false);
      }
    }
  } else {
    return resolve(false);
  }
}
