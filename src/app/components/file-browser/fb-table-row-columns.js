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

  // FIXME: maybe something like table-row model will be better than separater props

  previewMode: undefined,

  file: undefined,

  nameConflict: undefined,
});
