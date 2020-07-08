import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: [
    'row',
    'share-show-header-public',
  ],

  i18nPrefix: 'components.shareShow.headerPublic',

  /**
   * @virtual
   */
  shareName: undefined,
});
