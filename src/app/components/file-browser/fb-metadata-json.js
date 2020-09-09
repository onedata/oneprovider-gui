/**
 * Content for JSON metadata tab in file metadata modal: JSON editor
 * 
 * @module components/file-browser/fb-metadata-json
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import FbMetadataEditorBase from 'oneprovider-gui/components/file-browser/-fb-metadata-editor-base';

const mixins = [I18n, FbMetadataEditorBase];

export default Component.extend(...mixins, {
  classNames: ['fb-metadata-json'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbMetadataJson',
});
