/**
 * Header for single share view for signed-in user that allows to modify the share.
 * 
 * @module components/share-show/header-management
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */
import { Promise, hash as hashFulfilled } from 'rsvp';
import { computed, get, getProperties } from '@ember/object';
import { reads } from '@ember/object/computed';
import { collect, tag, conditional, raw, promise } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import HeaderBaseComponent from './-header-base';
import FileArchiveInfo from 'oneprovider-gui/utils/file-archive-info';

export default HeaderBaseComponent.extend(I18n, {
  classNames: [
    'row',
    'share-show-header-management',
  ],

  i18nPrefix: 'components.shareShow.headerManagemenet',

  /**
   * @virtual
   * @type {String}
   */
  spaceId: undefined,

  /**
   * @virtual
   * @type {Models.Share}
   */
  share: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  onShowShareList: notImplementedThrow,

  /**
   * @virtual
   * @type {Boolean}
   */
  shareRootDeleted: false,

  /**
   * @type {Boolean}
   */
  removeShareOpened: false,

  /**
   * @type {Window}
   */
  _window: window,

  actionsOpened: false,

  /**
   * @type {ComputedProperty<String>}
   */
  menuTriggerClass: tag `actions-share-${'elementId'}`,

  /**
   * @type {ComputedProperty<String>}
   */
  menuTriggerSelector: tag `.${'menuTriggerClass'}`,

  /**
   * @type {ComputedProperty<Array<Object>>}
   */
  menuActions: collect('btnRename', 'btnRemove'),

  /**
   * @type {ComputedProperty<Object>}
   */
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

  /**
   * @type {ComputedProperty<Object>}
   */
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

  archiveInfoProxy: promise.object(computed(
    'share.privateRootFile',
    async function archiveInfoProxy() {
      const privateRootFile = await this.get('share.privateRootFile');
      const fileArchiveInfo = FileArchiveInfo.create({
        ownerSource: this,
        file: privateRootFile,
      });
      const info = await hashFulfilled(
        getProperties(
          fileArchiveInfo,
          'isInArchiveProxy',
          'archiveRelativeFilePathProxy'
        )
      );
      return {
        isInArchive: info.isInArchiveProxy,
        archiveRelativeFilePath: info.archiveRelativeFilePathProxy,
      };
    }
  )),

  archiveInfo: reads('archiveInfoProxy.content'),

  breadcrumbsRootIcon: conditional(
    'archiveInfo.isInArchive',
    raw('browser-archive'),
    raw('space'),
  ),

  breadcrumbsRootDir: conditional(
    'archiveInfo.isInArchive',
    'archiveInfo.archiveRelativeFilePath.firstObject',
    raw(undefined)
  ),

  actions: {
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
    toggleActions(open) {
      const _open = (typeof open === 'boolean') ? open : !this.get('actionsOpened');
      this.set('actionsOpened', _open);
    },
  },
});
