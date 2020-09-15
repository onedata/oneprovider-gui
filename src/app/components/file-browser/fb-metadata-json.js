/**
 * Content for JSON metadata tab in file metadata modal: JSON editor
 * 
 * @module components/file-browser/fb-metadata-json
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import I18n from 'onedata-gui-common/mixins/components/i18n';
import FbMetadataEditorBase from 'oneprovider-gui/components/file-browser/-fb-metadata-ace-editor-base';

export default FbMetadataEditorBase.extend(I18n, {
  classNames: ['fb-metadata-json'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbMetadataJson',
});
