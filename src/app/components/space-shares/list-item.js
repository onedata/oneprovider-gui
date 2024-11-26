/**
 * Single share of space on list
 *
 * @author Jakub Liput
 * @copyright (C) 2020-2023 ACK CYFRONET AGH
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
import isNotFoundError from 'oneprovider-gui/utils/is-not-found-error';

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
   * @type {ComputedProperty<Boolean>}
   */
  pointsToDeletedFile: computed('publicFileError', function pointsToDeletedFile() {
    return isNotFoundError(this.publicFileError);
  }),

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
  icon: computed('share.rootFileType', function icon() {
    return this.share?.rootFileType === FileType.Regular ?
      'browser-file' : 'browser-directory';
  }),

  /**
   * @type {ComputedProperty<string>}
   */
  iconTip: computed(
    'share.rootFileType',
    'pointsToDeletedFile',
    function icon() {
      if (this.pointsToDeletedFile) {
        const tipKey = this.share?.rootFileType === FileType.Regular ?
          'deletedFileIconTip' : 'deletedDirectoryIconTip';
        return this.t(tipKey);
      }

    }
  ),

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

  // FIXME: experimental
  privateFileError: reads('rootFilePrivateProxy.reason'),

  shareFilePathErrorMessage: computed(
    'privateFileError',
    function shareFilePathErrorMessage() {
      const error = this.privateFileError;
      return this.errorExtractor.getMessage(error)?.message;
    }
  ),

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
