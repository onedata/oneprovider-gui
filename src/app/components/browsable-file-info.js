/**
 * A customized SingleFileInfo intended for info about file that has to be chosen by user.
 *
 * @author Jakub Liput
 * @copyright (C) 2026 Onedata (onedata.org)
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@glimmer/component';

/**
 * @typedef {Object} BrowsableFileInfoSignature
 * @property {HTMLDivElement} Element
 * @property {BrowsableFileInfoArgs} Args
 */

/**
 * @typedef {Object} BrowsableFileInfoArgs
 * @property {string} placeholder Text displayed instead of a file name, if file is not
 *   yet chosen.
 */

/**
 * @extends {Component<BrowsableFileInfoSignature>}
 */
export default class BrowsableFileInfoComponent extends Component {
  get placeholder() {
    return this.args.placeholder;
  }

  get fileInfo() {
    return this.file ?? {
      name: this.placeholder,
      size: null,
      mtime: null,
    };
  }
}
