/**
 * Content for RDF metadata tab in file metadata modal: XML editor
 *
 * @author Jakub Liput
 * @copyright (C) 2020-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import I18n from 'onedata-gui-common/mixins/components/i18n';
import AceEditorBase from 'oneprovider-gui/components/file-metadata/-ace-editor-base';
import { conditional, eq, raw } from 'ember-awesome-macros';
import { computed } from '@ember/object';
import { emptyValue } from 'oneprovider-gui/utils/file-metadata-view-model';
import globals from 'onedata-gui-common/utils/globals';

export default AceEditorBase.extend(I18n, {
  classNames: ['file-metadata-rdf'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileMetadata.rdf',

  /**
   * @override
   */
  metadataForEditor: conditional(
    eq('metadata', raw(emptyValue)),
    raw(''),
    computed('metadata', function metadataForEditor() {
      const metadata = this.get('metadata');
      if (metadata && typeof metadata === 'object') {
        if (metadata.onedata_base64) {
          return globals.window.atob(metadata.onedata_base64);
        } else {
          return '';
        }
      } else {
        return metadata;
      }
    }),
  ),
});
