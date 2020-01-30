import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { htmlSafe } from '@ember/string';
import { conditional, raw, eq, tag, collect } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { inject as service } from '@ember/service';
import { guidFor } from '@ember/object/internals';

export default Component.extend(I18n, {
  tagName: '',

  globalNotify: service(),

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
      action: () => {
        this.$('.btn-public-url').click();
      },
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

  icon: conditional(
    eq('share.fileType', raw('file')),
    raw('browser-file'),
    raw('browser-directory')
  ),

  actions: {
    toggleActions(open) {
      const _open = (typeof open === 'boolean') ? open : !this.get('actionsOpened');
      this.set('actionsOpened', _open);
    },
    clipboardSuccess() {
      // TODO: ready to use with notify delegation
      this.get('globalNotify').success(this.t('clipboardSuccess'));
    },
    clipboardError() {
      // TODO: ready to use with notify delegation
      this.get('globalNotify').error(this.t('clipboardError'));
    },
  },
});
