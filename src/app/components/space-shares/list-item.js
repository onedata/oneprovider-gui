/**
 * Single share of space on list
 *
 * @author Jakub Liput
 * @copyright (C) 2020-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { htmlSafe } from '@ember/string';
import { tag, collect, promise } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/i18n';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { inject as service } from '@ember/service';
import { guidFor } from '@ember/object/internals';
import isPosixViewForbidden from 'oneprovider-gui/utils/is-posix-view-forbidden';
import FileConsumerMixin from 'oneprovider-gui/mixins/file-consumer';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';
import { reads, bool, or } from '@ember/object/computed';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import { FileType, LegacyFileType } from 'onedata-gui-common/utils/file';
import ShareRootErrorInfo, { ShareFileErrorType } from 'oneprovider-gui/utils/share-root-error-info';

const mixins = [
  I18n,
  FileConsumerMixin,
];

export default Component.extend(...mixins, {
  classNames: ['share-list-item'],
  attributeBindings: ['dataRowId:data-row-id'],

  globalNotify: service(),
  globalClipboard: service(),
  errorExtractor: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceShares.listItem',

  /**
   * @virtual
   * @type {Function}
   */
  getShareUrl: undefined,

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {OneproviderShareListItem}
   */
  share: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  onStartRemoveShare: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   */
  onStartRenameShare: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   */
  onShareListChanged: undefined,

  /**
   * @type {ComputedProperty<boolean>}
   */
  hasManageSharesPrivilege: bool('space.privileges.manageShares'),

  /**
   * We need posixPermissions only for public file to show warning about lack of "Others"
   * POSIX permission.
   * @override
   * @implements {Mixins.FileConsumer}
   */
  fileRequirements: computed('rootFilePublicGri', function fileRequirements() {
    if (!this.rootFilePublicGri) {
      return [];
    }
    return [
      new FileRequirement({
        fileGri: this.rootFilePublicGri,
        properties: ['posixPermissions'],
      }),
    ];
  }),

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  usedFileGris: computed('rootFilePublicGri', function usedFileGris() {
    return this.rootFilePublicGri ? [this.rootFilePublicGri] : [];
  }),

  /**
   * @type {ComputedProperty<FileType>}
   */
  rootFileType: reads('share.rootFileType'),

  /**
   * @type {ComputedProperty<string>}
   */
  rootFilePublicGri: reads('share.rootFilePublicGri'),

  /**
   * @type {ComputedProperty<string>}
   */
  rootFilePrivateGri: reads('share.rootFilePrivateGri'),

  /**
   * @type {ComputedProperty<PromiseObject<Models.File>>}
   */
  rootFilePublicProxy: reads('share.rootFilePublicProxy'),

  /**
   * @type {ComputedProperty<PromiseObject<Models.File>>}
   */
  rootFilePrivateProxy: reads('share.rootFilePrivateProxy'),

  /**
   * Frame name, where Onezone share link should be opened
   * @type {String}
   */
  target: '_top',

  actionsOpened: false,

  dataRowId: reads('share.id'),

  /**
   * @type {Array<object>}
   */
  menuActions: collect('btnRename', 'btnRemove', 'btnCopyPublicUrl'),

  componentGuid: computed(function componentGuid() {
    return guidFor(this);
  }),

  btnRemove: computed('hasManageSharesPrivilege', function btnRemove() {
    const disabledTip = this.hasManageSharesPrivilege ?
      null :
      insufficientPrivilegesMessage({
        i18n: this.i18n,
        modelName: 'space',
        privilegeFlag: 'space_manage_shares',
      });
    return {
      title: this.t('removeShare'),
      icon: 'x',
      disabled: Boolean(disabledTip),
      tip: disabledTip,
      action: () => {
        return this.onStartRemoveShare(this.share);
      },
      class: 'btn-remove-share',
    };
  }),

  btnRename: computed('hasManageSharesPrivilege', function btnRename() {
    const disabledTip = this.hasManageSharesPrivilege ?
      null :
      insufficientPrivilegesMessage({
        i18n: this.i18n,
        modelName: 'space',
        privilegeFlag: 'space_manage_shares',
      });
    return {
      title: this.t('rename'),
      icon: 'browser-rename',
      disabled: Boolean(disabledTip),
      tip: disabledTip,
      action: () => {
        return this.onStartRenameShare(this.share);
      },
      class: 'btn-rename-share',
    };
  }),

  btnCopyPublicUrl: computed(function btnCopyPublicUrl() {
    return {
      title: this.t('copyPublicUrl'),
      icon: 'browser-copy',
      action: () => this.globalClipboard.copy(
        this.share.sharePublicUrl,
        this.t('publicUrl')
      ),
      class: 'btn-rename-share',
    };
  }),

  href: computed(function href() {
    const {
      getShareUrl,
      share,
    } = this;
    return htmlSafe(getShareUrl({ shareId: get(share, 'id') }));
  }),

  triggerClass: tag`actions-share-${'componentGuid'}`,

  triggerSelector: tag`.${'triggerClass'}`,

  /**
   * @type {ComputedProperty<string>}
   */
  icon: computed('rootFileType', function icon() {
    return this.rootFileType === FileType.Regular ?
      'browser-file' : 'browser-directory';
  }),

  shareRootErrorInfo: computed(
    'rootFileType',
    'rootFilePublicProxy',
    'rootFilePrivateProxy',
    function shareRootErrorInfo() {
      return ShareRootErrorInfo.create({
        ownerSource: this,
        rootFileType: this.rootFileType,
        rootFilePrivateProxy: this.rootFilePrivateProxy,
        rootFilePublicProxy: this.rootFilePublicProxy,
      });
    }
  ),

  /**
   * @type {ComputedProperty<ShareFileErrorType>}
   */
  rootFileErrorType: reads('shareRootErrorInfo.rootFileErrorType'),

  tagIcon: computed('rootFileErrorType', function tagIcon() {
    switch (this.rootFileErrorType) {
      case ShareFileErrorType.NotFound:
        return 'x';
      case ShareFileErrorType.NoAccess:
        return 'ban-left';
      case ShareFileErrorType.OtherError:
        return 'warning';
      default:
        break;
    }
  }),

  iconClass: computed('rootFileErrorType', function iconClass() {
    switch (this.rootFileErrorType) {
      case ShareFileErrorType.NotFound:
      case ShareFileErrorType.OtherError:
        return 'danger-tag';
      case ShareFileErrorType.NoAccess:
        return 'bold-tag warning-tag';
      default:
        break;
    }
  }),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  rootFileTip: reads('shareRootErrorInfo.tip'),

  isViewForOtherForbiddenProxy: promise.object(computed(
    'rootFilePublicProxy.content.{type,posixPermissions}',
    async function isViewForOtherForbiddenProxy() {
      const rootFilePublic = await this.rootFilePublicProxy;
      const octalNumber = 2;
      return isPosixViewForbidden(rootFilePublic, octalNumber);
    }
  )),

  forbiddenTooltipTextProxy: promise.object(computed(
    'rootFilePublicProxy.content.type',
    async function forbiddenTooltipTextProxy() {
      const rootFilePublic = await this.rootFilePublicProxy;
      return this.t(
        'warning.' + (rootFilePublic.type === LegacyFileType.Regular ? 'file' : 'dir')
      );
    }
  )),

  isNoPublicAccessLabelShown: bool('isViewForOtherForbiddenProxy.content'),

  isOpenDataLabelShown: reads('share.hasHandle'),

  isLabelsContanierShown: or('isNoPublicAccessLabelShown', 'isOpenDataLabelShown'),

  shareFilePathProxy: computed('rootFilePrivateProxy', function shareFilePathProxy() {
    const promise = (async () => {
      const rootFilePrivate = await this.rootFilePrivateProxy;
      if (!rootFilePrivate) {
        return null;
      }
      return stringifyFilePath(await resolveFilePath(rootFilePrivate));
    })();
    return promiseObject(promise);
  }),

  shareFilePath: reads('shareFilePathProxy.content'),

  isPathNotAvailable: computed(
    'shareFilePathProxy.{isSettled,isRejected}',
    'shareFilePath',
    function isPathNotAvailable() {
      return get(this.shareFilePathProxy, 'isRejected') ||
        get(this.shareFilePathProxy, 'isSettled') && !this.shareFilePath;
    }
  ),

  publicFileError: reads('rootFilePublicProxy.reason'),

  privateFileError: reads('rootFilePrivateProxy.reason'),

  init() {
    this._super(...arguments);
  },

  actions: {
    toggleActions(open) {
      const _open = (typeof open === 'boolean') ? open : !this.get('actionsOpened');
      this.set('actionsOpened', _open);
    },
    shareListChanged() {
      return this.onShareListChanged?.();
    },
  },
});
