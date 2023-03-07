/**
 * Header for single share view for anonymous user only for browsing the share.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { promise } from 'ember-awesome-macros';
import HeaderBaseComponent from './-header-base';

export default HeaderBaseComponent.extend(I18n, {
  classNames: [
    'row',
    'share-show-header-public',
  ],

  /**
   * @override
   */
  i18nPrefix: 'components.shareShow.headerPublic',

  /**
   * @type {ComputedProperty<PromiseObject>}
   */
  handleDataProxy: promise.object(promise.all('handleProxy', 'handleServiceProxy')),
});
