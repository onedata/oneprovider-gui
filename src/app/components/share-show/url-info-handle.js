/**
 * Information about "handle" type of URL for share
 *
 * @module components/share-show/url-info-handle
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
  i18nPrefix: 'components.shareShow.urlInfoHandle',

  /**
   * @virtual
   * @type {Models.Share}
   */
  share: undefined,
});
