/**
 * Content for RDF metadata tab in file metadata modal: XML editor
 * 
 * @module components/file-browser/fb-metadata-rdf
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { conditional, eq, raw } from 'ember-awesome-macros';
import { emptyValue } from 'oneprovider-gui/components/file-browser/fb-metadata-modal';

export default Component.extend({
  /**
   * @virtual
   * @type {String}
   */
  metadata: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  metadataChanged: undefined,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  previewMode: false,

  textareaRows: 10,

  metadataForEditor: conditional(
    eq('metadata', raw(emptyValue)),
    raw(''),
    'metadata'
  ),

  actions: {
    rdfChanged(value) {
      this.get('metadataChanged')({
        metadata: value || emptyValue,
        isValid: true,
      });
    },
  },
});
