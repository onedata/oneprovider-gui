/**
 * Additional information about file, other than name, for use in mobile mode
 *
 * @module components/file-browser/fb-table-row-mobile-info
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  tagName: 'div',
  classNames: ['fb-table-row-mobile-info', 'file-info-mobile'],

  file: undefined,
});
