/**
 * Row of file browser table header (thead)
 *
 * @module components/file-browser/fb-table-head-row
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  tagName: 'tr',
  classNames: ['fb-table-head-row'],

  // TODO: VFS-7643 a table or browser model could be used instead of separate params
});
