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
import { conditional, raw, eq, tag, collect, promise } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/i18n';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { inject as service } from '@ember/service';
import { guidFor } from '@ember/object/internals';
import computedT from 'onedata-gui-common/utils/computed-t';
import isPosixViewForbidden from 'oneprovider-gui/utils/is-posix-view-forbidden';
import FileConsumerMixin from 'oneprovider-gui/mixins/file-consumer';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';
import { computedRelationProxy } from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import { reads, bool, or } from '@ember/object/computed';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';

const mixins = [
  I18n,
  FileConsumerMixin,
];

export default Component.extend(...mixins, {
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
   * @type {Models.Share}
   */
  share: undefined,

  /**
   * @virtual
   * @type {Boolean}
   */
  pointsToDeletedFile: false,

  /**
   * @virtual
   * @type {Function}
   */
  startRemoveShare: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   */
  startRenameShare: notImplementedThrow,

  //#region state

  /**
   * Error from fetching share private root.
   * @type {any}
   */
  sharePrivateRootFileError: undefined,

  //#endregion

  /**
   * @type {ComputedProperty<boolean>}
   */
  hasManageSharesPrivilege: bool('space.privileges.manageShares'),

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  fileRequirements: computed('rootFileGri', function fileRequirements() {
    if (!this.rootFileGri) {
      return [];
    }
    return [
      new FileRequirement({
        fileGri: this.rootFileGri,
        properties: ['posixPermissions'],
      }),
    ];
  }),

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  usedFileGris: computed('rootFileGri', function usedFileGris() {
    return this.rootFileGri ? [this.rootFileGri] : [];
  }),

  rootFileGri: computed('share', function rootFileGri() {
    return this.share?.belongsTo('rootFile').id();
  }),

  rootFileProxy: computedRelationProxy(
    'share',
    'rootFile'
  ),

  /**
   * Frame name, where Onezone share link should be opened
   * @type {String}
   */
  target: '_top',

  actionsOpened: false,

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
        const {
          startRemoveShare,
          share,
        } = this.getProperties('startRemoveShare', 'share');
        return startRemoveShare(share);
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
        const {
          startRenameShare,
          share,
        } = this.getProperties('startRenameShare', 'share');
        return startRenameShare(share);
      },
      class: 'btn-rename-share',
    };
  }),

  btnCopyPublicUrl: computed(function btnCopyPublicUrl() {
    return {
      title: this.t('copyPublicUrl'),
      icon: 'browser-copy',
      action: () => this.get('globalClipboard').copy(
        this.get('share.publicUrl'),
        this.t('publicUrl')
      ),
      class: 'btn-rename-share',
    };
  }),

  href: computed(function href() {
    const {
      getShareUrl,
      share,
    } = this.getProperties('getShareUrl', 'share');
    return htmlSafe(getShareUrl({ shareId: get(share, 'entityId') }));
  }),

  triggerClass: tag`actions-share-${'componentGuid'}`,

  triggerSelector: tag`.${'triggerClass'}`,

  /**
   * @type {ComputedProperty<String>}
   */
  icon: conditional(
    eq('share.rootFileType', raw('file')),
    raw('browser-file'),
    raw('browser-directory')
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  iconTip: conditional(
    'pointsToDeletedFile',
    conditional(
      eq('share.rootFileType', raw('file')),
      computedT('deletedFileIconTip'),
      computedT('deletedDirectoryIconTip'),
    ),
    raw(undefined)
  ),

  isViewForOtherForbiddenProxy: promise.object(computed(
    'rootFileProxy.content.{type,posixPermissions}',
    async function isViewForOtherForbiddenProxy() {
      const rootFile = await this.rootFileProxy;
      const octalNumber = 2;
      return isPosixViewForbidden(rootFile, octalNumber);
    }
  )),

  forbiddenTooltipTextProxy: promise.object(computed(
    'rootFileProxy.content.type',
    async function forbiddenTooltipTextProxy() {
      const rootFile = await this.rootFileProxy;
      if (get(rootFile, 'type') === 'file') {
        return this.t('warning.file');
      } else {
        return this.t('warning.dir');
      }
    }
  )),

  isNoPublicAccessLabelShown: bool('isViewForOtherForbiddenProxy.content'),

  isOpenDataLabelShown: reads('share.hasHandle'),

  isLabelsContanierShown: or('isNoPublicAccessLabelShown', 'isOpenDataLabelShown'),

  privateRootFileProxy: computedRelationProxy('share', 'privateRootFile', {
    reload: true,
    computedRelationErrorProperty: 'sharePrivateRootFileError',
  }),

  shareFilePathProxy: computed('privateRootFileProxy', function shareFilePathProxy() {
    const promise = (async () => {
      const file = await this.privateRootFileProxy;
      if (!file) {
        return null;
      }
      return stringifyFilePath(await resolveFilePath(file));
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

  shareFilePathErrorMessage: computed(
    'sharePrivateRootFileError',
    function shareFilePathErrorMessage() {
      const reason = this.sharePrivateRootFileError;
      return this.errorExtractor.getMessage(reason)?.message;
    }
  ),

  actions: {
    toggleActions(open) {
      const _open = (typeof open === 'boolean') ? open : !this.get('actionsOpened');
      this.set('actionsOpened', _open);
    },
  },
});
