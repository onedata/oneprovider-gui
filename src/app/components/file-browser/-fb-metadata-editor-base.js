/**
 * Base functionality for integrating ACE editor in metadata tab components
 * 
 * @module components/file-browser/-fb-metadata-editor-base
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Mixin from '@ember/object/mixin';
import { emptyValue } from 'oneprovider-gui/components/file-browser/fb-metadata-modal';
import { conditional, eq, raw } from 'ember-awesome-macros';
import { observer } from '@ember/object';

export default Mixin.create({
  metadataForEditor: conditional(
    eq('metadata', raw(emptyValue)),
    raw(''),
    'metadata'
  ),

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

  /**
   * @virtual optional
   * @type {Boolean}
   * Set to true if this editor is visible - eg. when using with tabs.
   */
  isActive: true,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  isValid: true,

  /**
   * @type {ace/Editor}
   */
  aceEditor: null,

  /**
   * @override
   */
  didInsertElement() {
    this._super(...arguments);
    this.$().closest('.modal-dialog').on('transitionend', () => this.resizeAce());
  },

  /**
   * @override
   */
  didRender() {
    this._super(...arguments);
    this.resizeAce();
  },

  isActiveChanged: observer('isActive', function isActiveChanged() {
    this.resizeAce();
  }),

  setupAceEditor(aceEditor) {
    this.set('aceEditor', aceEditor);
    aceEditor.getSession().on('changeAnnotation', () => {
      this.annotationChanged();
    });
  },

  annotationChanged() {
    const annotations = this.get('aceEditor').getSession().getAnnotations();
    const errorsPresent = annotations && annotations.some(annotation =>
      annotation && annotation.type === 'error'
    );
    this.get('metadataChanged')({
      isValid: !errorsPresent,
    });
  },

  resizeAce() {
    const {
      ace,
      isActive,
    } = this.getProperties('aceEditorEditor', 'isActive');
    if (isActive && ace) {
      ace.resize();
    }
  },

  actions: {
    aceEditorReady(aceEditor) {
      this.setupAceEditor(aceEditor);
    },
    metadataChanged(value) {
      this.get('metadataChanged')({
        metadata: value || emptyValue,
        isValid: emptyValue ? true : undefined,
      });
    },
  },
});
