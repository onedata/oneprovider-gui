/**
 * A customized BrowsableFileInfo intended upolading a file from user devide that might
 * replace exisiting Onedata file.
 *
 * @author Jakub Liput
 * @copyright (C) 2026 Onedata (onedata.org)
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@glimmer/component';

/**
 * @typedef {Object} ReplaceableFileInfoSignature
 * @property {HTMLDivElement} Element
 * @property {ReplaceableFileInfoArgs} Args
 */

/**
 * @typedef {Object} ReplaceableFileInfoArgs
 * @property {File} selectedFile A file selected from user's device that will replace the
 *   existing Onedata file.
 * @property {Models.File} targetFile A Onedata file that will be replaced by the selected
 *   file.
 * @property {string} [placeholder] The same as in BrowsableFileInfo.
 */

/**
 * @extends {Component<ReplaceableFileInfoSignature>}
 */

export default class ReplaceableFileInfo extends Component {
  get selectedFile() {
    return this.args.selectedFile;
  }

  get targetFile() {
    return this.args.targetFile;
  }

  get nameComponent() {
    return (this.selectedFile && this.selectedFile.name !== this.targetFile.name) ?
      'replaced-file-name' : null;
  }

  get nameComponentContext() {
    return {
      targetFile: this.args.targetFile,
    };
  }
}
