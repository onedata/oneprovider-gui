/**
 * Single share of space on list
 *
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { htmlSafe } from '@ember/string';
import { conditional, raw, eq, tag, collect, promise } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { inject as service } from '@ember/service';
import { guidFor } from '@ember/object/internals';
import computedT from 'onedata-gui-common/utils/computed-t';
import isPosixViewForbidden from 'oneprovider-gui/utils/is-posix-view-forbidden';

export default Component.extend(I18n, {
  globalNotify: service(),
  globalClipboard: service(),

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

  btnRemove: computed(function btnRemove() {
    return {
      title: this.t('removeShare'),
      icon: 'x',
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

  btnRename: computed(function btnRename() {
    return {
      title: this.t('rename'),
      icon: 'browser-rename',
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

  triggerClass: tag `actions-share-${'componentGuid'}`,

  triggerSelector: tag `.${'triggerClass'}`,

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
    'share.rootFile.{type,posixPermissions}',
    async function isViewForOtherForbiddenProxy() {
      const file = await this.get('share.rootFile');
      const octalNumber = 2;
      return isPosixViewForbidden(file, octalNumber);
    }
  )),

  forbiddenTooltipTextProxy: promise.object(computed(
    'share.rootFile.type',
    async function forbiddenTooltipTextProxy() {
      const sharedFile = await this.get('share.rootFile');
      if (get(sharedFile, 'type') === 'file') {
        return this.t('warning.file');
      } else {
        return this.t('warning.dir');
      }
    }
  )),

  actions: {
    toggleActions(open) {
      const _open = (typeof open === 'boolean') ? open : !this.get('actionsOpened');
      this.set('actionsOpened', _open);
    },
  },
});
