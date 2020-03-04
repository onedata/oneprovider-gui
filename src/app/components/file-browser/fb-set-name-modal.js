/**
 * Base component of modal for setting new name of file list item
 * 
 * @module components/file-browser/fb-set-name-modal
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { isEmpty } from 'ember-awesome-macros';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import { next } from '@ember/runloop';
import { computed } from '@ember/object';
import layout from 'oneprovider-gui/templates/components/file-browser/fb-set-name-modal';

// TODO: validate to disallow / names

export default Component.extend(I18n, {
  layout,

  /**
   * @virtual
   * If true, the modal will open
   * @type {boolean}
   */
  open: false,

  /**
   * @virtual optional
   * One of: dir, file - File type to create with this modal
   * @type {string}
   */
  itemType: undefined,

  /**
   * @virtual
   * Parent dir for newly created or renamed dir/file.
   * @type {models/File}
   */
  parentDir: undefined,

  /**
   * @virtual optional
   * File which name will be changed, only in rename mode.
   * @type {models/File}
   */
  file: undefined,

  /**
   * @virtual
   * Callback when the modal is starting to hide
   * @type {Function}
   * @param {boolean} isCreated
   * @param {submitResult}
   */
  onHide: notImplementedIgnore,

  /**
   * @virtual optional
   * @type {Function}
   * @param {result}
   */
  onFinish: notImplementedIgnore,

  /**
   * Stores current value of input
   * @type {string}
   */
  editValue: '',

  /**
   * @type {ComputedProperty<boolean>}
   */
  submitDisabled: isEmpty('editValue'),

  inputId: computed('elementId', function inputId() {
    return `${this.elementId}-name-input`;
  }),

  inputElement: computed('inputId', function $inputElement() {
    return document.getElementById(this.get('inputId'));
  }),

  onShownRender() {
    this.get('inputElement').focus();
  },

  actions: {
    onHide() {
      return this.get('onHide')(false);
    },
    onHidden() {
      this.setProperties({
        editValue: '',
      });
    },
    onShow() {
      this.get('inputElement').focus();
    },
    submit() {
      return notImplementedReject();
    },
  },
});
