/**
 * Base functionality for integrating ACE editor in metadata tab components
 *
 * @author Jakub Liput
 * @copyright (C) 2020-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { emptyValue } from 'oneprovider-gui/utils/file-metadata-view-model';
import { conditional, eq, raw } from 'ember-awesome-macros';
import { computed, observer } from '@ember/object';
import $ from 'jquery';
import dom from 'onedata-gui-common/utils/dom';
import globals from 'onedata-gui-common/utils/globals';
import _ from 'lodash';

export default Component.extend({
  classNames: ['file-metadata-ace-editor-base'],

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
   * @virtual
   * @type {SafeString}
   */
  typeTranslation: '',

  /**
   * @virtual optional
   * @type {Boolean}
   */
  readonly: false,

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
   * @type {jQuery}
   */
  $modalDialog: null,

  /**
   * An additional stylesheet for elements in this element
   * @type {String}
   */
  styleOverride: '',

  /**
   * @type {ComputedProperty<Function>}
   */
  resizeAceFun: computed(function resizeAceFun() {
    return this.resizeAce.bind(this);
  }),

  fixTooltipPositionFun: computed(function fixTooltipPositionFun() {
    return this.fixTooltipPosition.bind(this);
  }),

  /**
   * @type {ComputedProperty<string>}
   */
  typeTranslationLowerCase: computed(
    'typeTranslation',
    function typeTranslationLowerCase() {
      return _.lowerCase(this.typeTranslation);
    }
  ),

  isActiveChanged: observer('isActive', function isActiveChanged() {
    this.resizeAce();
  }),

  fixTooltipPosition() {
    const modalDialog = this.getModalDialog()[0];
    const { left, top } = modalDialog ? dom.offset(modalDialog) : { top: 0, left: 0 };
    this.set(
      'styleOverride',
      `#${this.get('elementId')} .ace_tooltip { transform: translate(-${left}px, -${top}px); }`
    );
  },

  /**
   * @override
   */
  didInsertElement() {
    this._super(...arguments);
    this.set('$modalDialog', this.getModalDialog());
    this.toggleResizeHandler(true);
  },

  /**
   * @override
   */
  didRender() {
    this._super(...arguments);
    this.resizeAce();
  },

  willDestroyElement() {
    this._super(...arguments);
    this.toggleResizeHandler(false);
  },

  toggleResizeHandler(enable) {
    const {
      resizeAceFun,
      fixTooltipPositionFun,
    } = this.getProperties('resizeAceFun', 'fixTooltipPositionFun');
    if (enable) {
      this.resizeAce();
      this.fixTooltipPosition();
    }
    const dialog = this.getModalDialog();
    dialog[enable ? 'on' : 'off'](
      'transitionend',
      resizeAceFun
    );
    globals.window[enable ? 'addEventListener' : 'removeEventListener'](
      'resize',
      fixTooltipPositionFun
    );
  },

  getModalDialog() {
    const {
      $modalDialog,
      element,
    } = this.getProperties('$modalDialog', 'element');
    return $modalDialog || $(element).closest('.modal-dialog');
  },

  setupAceEditor(aceEditor) {
    this.set('aceEditor', aceEditor);
    aceEditor.getSession().on('changeAnnotation', () => {
      this.annotationChanged();
    });
  },

  annotationChanged() {
    const {
      aceEditor,
      metadataChanged,
    } = this.getProperties('aceEditor', 'metadataChanged');
    const annotations = aceEditor.getSession().getAnnotations();
    const errorsPresent = annotations && annotations.findBy('type', 'error');
    metadataChanged({
      isValid: !errorsPresent,
      isValidating: false,
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
      const data = {
        metadata: value || emptyValue,
      };
      if (value === '') {
        data.isValid = true;
      } else {
        data.isValidating = true;
      }
      this.get('metadataChanged')(data);
    },
  },
});
