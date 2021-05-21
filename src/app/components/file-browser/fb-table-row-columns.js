/**
 * Columns other than "name" for desktop mode browser
 *
 * @module components/file-browser/fb-table-row-columns
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  tagName: '',

  /**
   * @virtual
   * @type {Object}
   */
  browserModel: undefined,

  // TODO: VFS-7643 maybe something like table-row model will be better than separated props

  previewMode: undefined,

  file: undefined,

  nameConflict: undefined,
});
