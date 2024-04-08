/**
 * Information about "rest" type of URL for share
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */
import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';

export default Component.extend(I18n, {
  /**
   * @override
   */
  i18nPrefix: 'components.shareShow.urlInfoRest',

  /**
   * @virtual
   * @type {Models.Share}
   */
  share: undefined,
});
