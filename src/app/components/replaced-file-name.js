import Component from '@glimmer/component';

/**
 * @typedef {Object} ReplacedFileNameSignature
 * @property {HTMLDivElement} Element
 * @property {ReplacedFileNameArgs} Args
 */

/**
 * @typedef {Object} ReplacedFileNameArgs
 * @property {ReplacedFileData} file
 * @property {ReplacedFileNameContext} context
 */

/**
 * A file-model-like object.
 * @typedef {Object} ReplacedFileData
 * @property {string} name
 */

/**
 * @typedef {Object} ReplacedFileNameContext
 * @property {Models.File} targetFile
 */

/**
 * @extends {Component<ReplacedFileNameSignature>}
 */
export default class ReplacedFileNameComponent extends Component {
  get selectedFile() {
    return this.args.file;
  }
  get selectedFileName() {
    return this.selectedFile?.name;
  }
  get targetFileName() {
    return this.args.context?.targetFile?.name;
  }
  get replacementShown() {
    return Boolean(this.selectedFile && this.selectedFileName !== this.targetFileName);
  }
}
