/**
 * Pill-button for changing display/edit mode in open-data components
 *
 * @module components/share-show/open-data-mode-switch
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['open-data-mode-switch'],

  /**
   * @override
   */
  i18nPrefix: 'components.shareShow.openData',

  /**
   * One of: visual, xml
   * @virtual
   * @type {String}
   */
  mode: undefined,
});
