/**
 * Content for JSON metadata tab in file metadata modal: JSON editor
 *
 * @author Jakub Liput
 * @copyright (C) 2020-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import I18n from 'onedata-gui-common/mixins/components/i18n';
import AceEditorBase from 'oneprovider-gui/components/file-metadata/-ace-editor-base';

export default AceEditorBase.extend(I18n, {
  classNames: ['file-metadata-json'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileMetadata.json',
});
