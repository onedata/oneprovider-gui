import { Promise } from 'rsvp';
import { computed, get } from '@ember/object';
import { conditional, and, not, collect, tag } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import HeaderBaseComponent from './-header-base';

export default HeaderBaseComponent.extend(I18n, {
  classNames: [
    'row',
    'share-show-header-management',
    'with-menu',
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
  showShareList: notImplementedThrow,

  /**
   * @virtual
   * @type {Boolean}
   */
  shareRootDeleted: false,

  _window: window,

  publishModalOpened: false,

  actionsOpened: false,

  menuTriggerClass: tag `actions-share-${'elementId'}`,

  menuTriggerSelector: tag `.${'menuTriggerClass'}`,
  /**
   * @type {Array<object>}
   */
  menuActions: conditional(
    and('showPublishButton', not('share.hasHandle')),
    collect('btnRename', 'btnPublishOpenData', 'btnRemove'),
    collect('btnRename', 'btnRemove'),
  ),

  btnPublishOpenData: computed(function btnPublishOpenData() {
    return {
      title: this.t('publishOpenData'),
      icon: 'globe',
      action: () => {
        this.set('publishModalOpened', true);
      },
      class: 'btn-publish-open-data',
    };
  }),

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
