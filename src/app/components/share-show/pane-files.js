/**
 * Content for "files" tab for single share
 *
 * @author Jakub Liput
 * @copyright (C) 2020-2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { promise } from 'ember-awesome-macros';
import { resolve } from 'rsvp';
import I18n from 'onedata-gui-common/mixins/i18n';
import ShareFilesystemBrowserModel, {
  ShareRootDirClass,
  shareRootId,
} from 'oneprovider-gui/utils/share-filesystem-browser-model';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import ItemBrowserContainerBase from 'oneprovider-gui/mixins/item-browser-container-base';
import FilesViewContext from 'oneprovider-gui/utils/files-view-context';
import InfoModalBrowserSupport from 'oneprovider-gui/mixins/info-modal-browser-support';
import globals from 'onedata-gui-common/utils/globals';

const mixins = [
  I18n,
  ItemBrowserContainerBase,
  InfoModalBrowserSupport,
];

export default Component.extend(...mixins, {
  classNames: ['share-show-pane-files', 'pane-files'],

  fileManager: service(),
  filesViewResolver: service(),

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
   * @virtual
   * @type {Function}
   */
  getDataUrl: notImplementedThrow,

  /**
   * @virtual
   * @type {PromiseObject<Boolean>}
   */
  shareRootDeletedProxy: undefined,

  //#region browser items for various modals

  /**
   * @type {FileInfoTabId} activeTab
   */
  showInfoInitialTab: undefined,

  fileForConfirmDownload: null,

  //#endregion

  initialDirProxy: promise.object(computed('share', function initialDirProxy() {
    return this.get('dirProxy');
  })),

  /**
   * Always resolved when `initialDirProxy` settles (no matter if it resolves of rejects).
   */
  initialDirLoadingProxy: promise.object(computed(
    'initialDirProxy',
    async function initialDirLoadingProxy() {
      try {
        return await this.dirProxy;
      } catch {
        return null;
      }
    }
  )),

  requiredDataProxy: promise.object(promise.all(
    'initialDirLoadingProxy',
    'share.rootFile',
  )),

  spaceId: reads('share.spaceId'),

  dirProxy: promise.object(computed(
    'rootDir',
    'dirId',
    'spaceId',
    async function dirProxy() {
      const {
        share,
        spaceId,
        dirId,
        filesViewResolver,
        rootDir,
      } = this.getProperties(
        'share',
        'spaceId',
        'dirId',
        'filesViewResolver',
        'rootDir',
      );

      // special case - virtual share root, not supported by resolver (not a real dir)
      if (!dirId || dirId === shareRootId) {
        return rootDir;
      }

      const shareId = get(share, 'entityId');
      const currentFilesViewContext = FilesViewContext.create({
        spaceId,
        shareId,
      });

      const resolverResult = await filesViewResolver.resolveViewOptions({
        dirId,
        currentFilesViewContext,
        scope: 'public',
        fallbackDir: rootDir,
      });

      if (!resolverResult) {
        return null;
      }
      if (resolverResult.result === 'resolve') {
        return resolverResult.dir;
      } else {
        // TODO: VFS-8342 common util for replacing master URL
        if (resolverResult.result === 'redirect' && resolverResult.url) {
          globals.window.top.location.replace(resolverResult.url);
        }
        return rootDir;
      }
    }
  )),

  isRootDirExistingProxy: promise.object(computed('share.rootFile',
    async function isRootDirExistingProxy() {
      try {
        const {
          fileManager,
          share,
        } = this.getProperties('fileManager', 'share');
        const fileId = share.relationEntityId('rootFile');
        await fileManager.getFileById(fileId, { scope: 'public' });
        return true;
      } catch (error) {
        return false;
      }
    }
  )),

  dir: computedLastProxyContent('dirProxy'),

  rootDir: computed('share.{name,entityId}', function rootDir() {
    return ShareRootDirClass.create({
      name: this.get('share.name'),
      shareRootId: this.get('share.entityId'),
    });
  }),

  /**
   * @type {Utils.ShareFilesystemBrowserModel}
   */
  browserModel: computed(function browserModel() {
    return this.createBrowserModel();
  }),

  /**
   * @override
   */
  willDestroyElement() {
    try {
      this.browserModel?.destroy?.();
    } finally {
      this._super(...arguments);
    }
  },

  async getItemById(itemId) {
    if (itemId === shareRootId) {
      return this.get('rootDir');
    } else {
      return this.get('fileManager').getFileById(itemId, { scope: 'public' });
    }
  },

  createBrowserModel() {
    return ShareFilesystemBrowserModel
      .extend({
        share: reads('paneFiles.share'),
        isOwnerVisible: false,
        dirProxy: reads('paneFiles.dirProxy'),
      })
      .create({
        paneFiles: this,
        ownerSource: this,
        openInfo: this.openInfoModal.bind(this),
      });
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

  actions: {
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
