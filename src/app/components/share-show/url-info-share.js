/**
 * Information about "share" type of URL for share
 *
 * @module components/share-show/url-info-share
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */
import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  /**
   * @override
   */
  i18nPrefix: 'components.shareShow.urlInfoShare',

  /**
   * @virutal
   */
  share: undefined,
});
