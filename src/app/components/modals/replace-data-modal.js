/**
 * A modal in context of some existing Onedata file, for choosing a new file from user's
 * device, checking information and start replacing existing file content using upload.
 *
 * @author Jakub Liput
 * @copyright (C) 2026 Onedata (onedata.org)
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@glimmer/component';

/**
 * @typedef {Object} ReplaceDataModalOptions
 * @property {Models.File} file
 */

/**
 * @typedef {Object} ReplaceDataModalSignature
 * @property {null} Element
 * @property {ReplaceDataModalArgs} Args
 */

/**
 * @typedef {Object} ReplaceDataModalArgs
 * @property {ReplaceDataModalOptions} modalOptions
 * @property {string} modalId
 */

/**
 * @extends {Component<ReplaceDataModalSignature>}
 */
export default class ReplaceDataModalComponent extends Component {
  get file() {
    return this.args.modalOptions.file;
  }

  get modalId() {
    return this.args.modalId;
  }
}
