/**
 * Status bar section with tags for item row
 *
 * @module components/file-browser/fb-table-row-status-bar
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  tagName: 'div',
  classNames: ['fb-table-row-status-bar', 'file-status-bar'],

  // TODO: VFS-7643 maybe something like table-row model will be better than separated props

  previewMode: undefined,

  file: undefined,

  nameConflict: undefined,

  /**
   * Name of icon to indicate that some property in tag is inhertied from ancestor
   * @type {String}
   */
  inheritedIcon: 'arrow-long-up',
});
