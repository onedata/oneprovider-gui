/**
 * A customized SingleFileInfo intended for info about file that has to be chosen by user.
 *
 * @author Jakub Liput
 * @copyright (C) 2026 Onedata (onedata.org)
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@glimmer/component';
import { LegacyFileType } from 'onedata-gui-common/utils/file';

/**
 * @typedef {Object} BrowsableFileInfoSignature
 * @property {HTMLDivElement} Element
 * @property {BrowsableFileInfoArgs} Args
 */

/**
 * @typedef {Object} BrowsableFileInfoArgs
 * @property {string} placeholder Text displayed instead of a file name, if file is not
 *   yet chosen.
 * @property {File} [file] A chosen file.
 */

/**
 * @extends {Component<BrowsableFileInfoSignature>}
 */
export default class BrowsableFileInfoComponent extends Component {
  get placeholder() {
    return this.args.placeholder;
  }

  get file() {
    return this.args.file;
  }

  get fileIsChosen() {
    return Boolean(this.file);
  }

  get fileInfo() {
    if (this.file) {
      return inputFileToFileData(this.file);
    } else {
      return {
        name: this.placeholder,
        mtime: null,
        effFile: {
          size: null,
          type: LegacyFileType.Regular,
        },
      };
    }
  }
}

/**
 * @param {File} inputFile
 * @returns {Object}
 */
function inputFileToFileData(inputFile) {
  return {
    name: inputFile.name,
    mtime: inputFile.lastModified / 1000,
    effFile: {
      size: inputFile.size,
      type: LegacyFileType.Regular,
    },
  };
}
