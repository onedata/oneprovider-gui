/**
 * A modal in context of some existing Onedata file, for choosing a new file from user's
 * device, checking information and start replacing existing file content using upload.
 *
 * It initiates upload of the new file in place of the current file using a custom
 * `onedataReplacedFile` property set on the File instance, which is passed to the
 * Resumable.js `addFile` method. This indicates our `UploadManager` service, that
 * the new file should be uploaded using model of the current file (see `UploadManager`)
 * internals.
 *
 * @author Jakub Liput
 * @copyright (C) 2026 Onedata (onedata.org)
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { action } from '@ember/object';
import Component from '@glimmer/component';
import Locale from 'onedata-gui-common/utils/locale';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';

/**
 * @typedef {Object} ReplaceDataModalOptions
 * @property {Models.File} file
 * @property {FilesystemBrowserModel} browserModel
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
  @service uploadManager;
  @service modalManager;

  locale = new Locale('components.modals.replaceDataModal');

  /** @type {boolean} */
  @tracked
  acknowledgeChecked;

  /** @type {File} */
  @tracked
  newFile;

  /** @type {HTMLInputElement} */
  @tracked
  fileInputElement;

  constructor() {
    super(...arguments);
    this.reset();
  }

  get proceedDisabled() {
    return !this.newFile || !this.acknowledgeChecked;
  }

  get file() {
    return this.args.modalOptions.file;
  }

  get modalId() {
    return this.args.modalId;
  }

  get browserModel() {
    return this.args.modalOptions.browserModel;
  }

  reset() {
    this.acknowledgeChecked = false;
    this.newFile = false;
    this.fileInputElement = null;
  }

  /**
   * @param {HTMLInputElement} element
   */
  @action
  registerFileInput(element) {
    this.fileInputElement = element;
  }

  @action
  toggleAcknowledge() {
    this.acknowledgeChecked = !this.acknowledgeChecked;
  }

  @action
  browse() {
    this.fileInputElement.click();
  }

  /**
   * @param {InputEvent} event
   */
  @action
  changeFile() {
    this.newFile = this.fileInputElement.files[0];
  }

  @action
  onHide() {
    this.reset();
  }

  @action
  close() {
    this.modalManager.hide(this.modalId);
  }

  @action
  download() {
    this.browserModel.downloadFiles([this.file]);
  }

  @action proceed() {
    if (this.proceedDisabled) {
      return;
    }
    this.newFile.onedataReplacedFile = this.file;
    this.uploadManager.getResumable().addFile(this.newFile);
    this.close();
  }
}
