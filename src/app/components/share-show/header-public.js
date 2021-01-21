import I18n from 'onedata-gui-common/mixins/components/i18n';
import { promise } from 'ember-awesome-macros';
import HeaderBaseComponent from './-header-base';

export default HeaderBaseComponent.extend(I18n, {
  classNames: [
    'row',
    'share-show-header-public',
  ],

  i18nPrefix: 'components.shareShow.headerPublic',

  handleDataProxy: promise.object(promise.all('handleProxy', 'handleServiceProxy')),

});
