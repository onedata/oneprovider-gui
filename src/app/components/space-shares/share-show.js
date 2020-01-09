/**
 * Container for share file browser to use in an iframe with injected properties.
 * 
 * @module component/content-share-show
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import EmberObject, { computed, get } from '@ember/object';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import { promise, equal, raw, tag, collect } from 'ember-awesome-macros';
import { Promise, resolve, reject } from 'rsvp';
import I18n from 'onedata-gui-common/mixins/components/i18n';

// TODO: observer for changing dir that is injected to enable change in runtime

// FIXME: reading cdmiObjectId, distribution etc. should be blocked for root dir - add isVirtual or something

const shareRootId = 'shareRoot';

const ShareRootDir = EmberObject.extend({
  id: shareRootId,
  entityId: shareRootId,
  type: 'dir',
  secondaryType: 'shareRoot',
  hasParent: false,
  parent: promise.object(raw(resolve(null))),
});

export default Component.extend(I18n, {
  classNames: ['share-show', 'content-file-browser'],
  classNameBindings: ['withHeaderClass'],

  shareManager: service(),
  fileManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceShares.shareShow',

  /**
   * @virtual
   * @type {Models.Share}
   */
  share: undefined,

  /**
   * @virtual optional
   * @type {String}
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
  getTransfersUrl: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   */
  getDataUrl: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   */
  showShareList: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   */
  reloadShareList: notImplementedReject,

  /**
   * @virtual optional
   * @type {Function}
   */
  containerScrollTop: notImplementedIgnore,

  /**
   * Frame name, where Onezone share link should be opened
   * @type {String}
   */
  navigateDirTarget: '_top',

  _window: window,

  /**
   * @type {String}
   */
  spaceId: undefined,

  /**
   * @type {boolean}
   */
  showSharePath: true,

  /**
   * @type {boolean}
   */
  showSharePublicUrl: true,

  showHandleUrl: true,

  showPublishButton: true,

  publishModalOpened: false,

  actionsOpened: false,

  isInShareRoot: equal('dirProxy.content.secondaryType', raw('shareRoot')),

  // FIXME: ignore injected dirId if it is not child of selected share
  dirProxy: promise.object(computed('rootDir', 'dirId', function dirProxy() {
    const dirId = this.get('dirId');
    if (dirId) {
      return this.get('fileManager').getFile(dirId);
    } else {
      return resolve(this.get('rootDir'));
    }
  })),

  requiredDataProxy: promise.object(promise.all('dirProxy', 'share.rootFile')),

  /**
   * @type {Array<object>}
   */
  menuActions: collect('btnRename', 'btnRemove'),

  btnRemove: computed(function btnRemove() {
    return {
      title: this.t('remove'),
      icon: 'x',
      action: () => {
        this.set('removeShareOpened', true);
      },
      class: 'btn-remove-share',
    };
  }),

  btnRename: computed(function btnRename() {
    return {
      title: this.t('rename'),
      icon: 'browser-rename',
      action: () => {
        this.set('renameShareOpened', true);
      },
      class: 'btn-rename-share',
    };
  }),

  withHeaderClass: computed('showSharePath', 'showSharePublicUrl',
    function headerPanelClass() {
      const {
        showSharePath,
        showSharePublicUrl,
        showHandleUrl,
        share,
      } = this.getProperties(
        'showSharePath',
        'showSharePublicUrl',
        'showHandleUrl',
        'share',
      );
      const isPublished = Boolean(share.belongsTo('handle').id());
      const rowsCount = (showSharePath ? 1 : 0) + (showSharePublicUrl ? 1 : 0) +
        ((showHandleUrl && isPublished) ? 1 : 0);
      const classPrefix = 'with-header-';
      switch (rowsCount) {
        case 0:
          return classPrefix + 'hidden';
        case 1:
          return classPrefix + 'single';
        case 2:
          return classPrefix + 'double';
        case 3:
          return classPrefix + 'triple';
        default:
          break;
      }
    }
  ),

  rootDir: computed(function rootDir() {
    return ShareRootDir.create({
      name: this.get('share.name'),
      shareRootId: this.get('share.entityId'),
    });
  }),

  menuTriggerClass: computed('elementId', function triggerClass() {
    return `actions-share-${this.get('elementId')}`;
  }),

  menuTriggerSelector: tag `.${'menuTriggerClass'}`,

  actions: {
    fetchShareRootDirChildren(dirId, startIndex, size, offset, array) {
      if (dirId !== 'shareRoot') {
        return reject('cannot use fetchShareRootDirChildren for non-share-root');
      }
      if (startIndex == null) {
        if (size <= 0 || offset < 0) {
          return resolve([]);
        } else {
          return this.get('share.rootFile')
            .then(rootFile => [rootFile]);
        }
      } else if (startIndex === array.get('sourceArray.lastObject.index')) {
        return resolve([]);
      } else {
        return reject('cannot use fetch file transfer not from start');
      }
    },
    containerScrollTop() {
      return this.get('containerScrollTop')(...arguments);
    },
    updateDirId(dirId) {
      if (dirId !== shareRootId) {
        return this.get('updateDirId')(dirId);
      }
    },
    getTransfersUrl({ fileId, tabId }) {
      return this.get('getTransfersUrl')({ fileId, tabId });
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
    openSpaceDir(dir) {
      const {
        getDataUrl,
        spaceId,
        _window,
        navigateDirTarget,
      } = this.getProperties('getDataUrl', 'spaceId', '_window', 'navigateDirTarget');
      const dataUrl = getDataUrl({ spaceId, dirId: get(dir, 'entityId') });
      return new Promise(() => {
        _window.open(dataUrl, navigateDirTarget);
      });
    },
    startPublish() {
      this.set('publishModalOpened', true);
    },
    showMetadata() {
      this.set('shareMetadataOpened', true);
    },
    toggleActions(open) {
      const _open = (typeof open === 'boolean') ? open : !this.get('actionsOpened');
      this.set('actionsOpened', _open);
    },
    showShareList() {
      return this.get('reloadShareList')()
        .then(() => this.get('showShareList')());
    },
  },
});
