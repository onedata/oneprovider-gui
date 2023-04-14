/**
 * Content for "files" tab for single share
 *
 * @author Jakub Liput
 * @copyright (C) 2020-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import EmberObject, { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
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
import ItemBrowserContainerBase from 'oneprovider-gui/mixins/item-browser-container-base';
import FilesViewContext from 'oneprovider-gui/utils/files-view-context';
import InfoModalBrowserSupport from 'oneprovider-gui/mixins/info-modal-browser-support';
import globals from 'onedata-gui-common/utils/globals';

const shareRootId = 'shareRoot';

const ShareRootDir = EmberObject.extend({
  id: shareRootId,
  entityId: shareRootId,
  type: 'dir',
  isShareRoot: true,
  hasParent: false,
  parent: promise.object(raw(resolve(null))),
  async reload() {
    return this;
  },
});

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

  /**
   * @type {Array<Models.File>}
   */
  selectedItems: undefined,

  isInShareRoot: bool('dirProxy.content.isShareRoot'),

  initialDirProxy: promise.object(computed('share', function initialDirProxy() {
    return this.get('dirProxy');
  })),

  requiredDataProxy: promise.object(promise.all(
    'initialDirProxy',
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
        selectedItems,
        dirId,
        filesViewResolver,
        rootDir,
      } = this.getProperties(
        'share',
        'spaceId',
        'selectedItems',
        'dirId',
        'filesViewResolver',
        'rootDir',
      );

      // special case - virtual share root, not supported by resolver (not a real dir)
      if (!dirId || dirId === shareRootId) {
        return rootDir;
      }

      const selectedIds = selectedItems && selectedItems.mapBy('entityId') || [];
      const shareId = get(share, 'entityId');
      const currentFilesViewContext = FilesViewContext.create({
        spaceId,
        shareId,
      });

      const resolverResult = await filesViewResolver.resolveViewOptions({
        dirId,
        currentFilesViewContext,
        selectedIds,
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
    return ShareRootDir.create({
      name: this.get('share.name'),
      shareRootId: this.get('share.entityId'),
    });
  }),

  init() {
    this._super(...arguments);
    if (!this.get('selectedItems')) {
      this.set('selectedItems', []);
    }
    this.set('browserModel', this.createBrowserModel());
  },

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
    return FilesystemBrowserModel.create({
      ownerSource: this,
      rootIcon: 'share',
      readonlyFilesystem: true,
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

  getEmptyFetchChildrenResponse() {
    return {
      childrenRecords: [],
      isLast: true,
    };
  },

  actions: {
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
    changeSelectedItems(selectedItems) {
      return this.changeSelectedItems(selectedItems);
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
