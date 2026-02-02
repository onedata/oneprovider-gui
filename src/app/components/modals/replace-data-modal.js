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
 * @property {Object} modalApi
 */

/**
 * @extends {Component<ReplaceDataModalSignature>}
 */
export default class ReplaceDataModalComponent extends Component {
  @service uploadManager;
  @service modalManager;

  locale = new Locale('components.modals.replaceDataModal');

  /** @type {File} */
  @tracked newFile;

  /** @type {HTMLInputElement} */
  @tracked fileInputElement;

  /** @type {HTMLDivElement|null} */
  @tracked modalContentElement;

  /** @type {(event: DragEvent) => void} */
  @tracked onFileDragEnter;

  /** @type {(event: DragEvent) => void} */
  @tracked onFileDragLeave;

  /** @type {(event: DragEvent) => void} */
  @tracked onFileDrop;

  /** @type {(event: DragEvent) => void} */
  @tracked onFileDragOver;

  constructor() {
    super(...arguments);
    this.reset();
  }

  /** @override */
  willDestroy() {
    this.destroyDrop();
  }

  get proceedDisabled() {
    return !this.newFile;
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
    this.newFile = null;
    this.fileInputElement = null;
  }

  getDropElement() {
    return this.modalContentElement;
  }

  /**
   * @param {boolean} shown
   */
  toggleDropZone(shown) {
    this.getDropElement().classList[shown ? 'add' : 'remove']('file-drag');
  }

  /**
   * @param {DragEvent} event
   * @returns {File|null}
   */
  getDraggedFile(event) {
    const droppedItem = event.dataTransfer.items[0];
    if (droppedItem.kind !== 'file') {
      return null;
    }
    /** @type {FileSystemEntry} */
    const entry = droppedItem.webkitGetAsEntry?.() ?? droppedItem.getAsEntry?.();
    if (entry?.isDirectory) {
      return null;
    }
    return entry ? droppedItem.getAsFile() : event.dataTransfer.files[0];
  }

  /**
   * @param {DragEvent} event
   */
  handleDroppedItem(event) {
    const file = this.getDraggedFile(event);
    if (file) {
      this.newFile = file;
    }
  }

  // FIXME: zapakować to w obiekt ze stanem
  initDrop() {
    const dropElement = this.getDropElement();
    if (!dropElement) {
      console.error('ReplaceDataModal.initDrop: drag element not available');
      return;
    }

    /** @type {HTMLElement|null} */
    let lastElement;
    this.onFileDragEnter = (event) => {
      lastElement = event.target;
      this.toggleDropZone(true, !this.getDraggedFile(event));
    };
    this.onFileDragLeave = (event) => {
      if (event.target == lastElement) {
        this.toggleDropZone(false);
      }
    };
    this.onFileDrop = (event) => {
      try {
        event.preventDefault();
        this.handleDroppedItem(event);
      } finally {
        this.toggleDropZone(false);
      }
    };
    this.onFileDragOver = (event) => {
      event.preventDefault();
    };

    dropElement.addEventListener('dragenter', this.onFileDragEnter);
    dropElement.addEventListener('dragleave', this.onFileDragLeave);
    // dropElement.addEventListener('dragend', this.onFileEndDrag);
    dropElement.addEventListener('dragover', this.onFileDragOver);
    dropElement.addEventListener('drop', this.onFileDrop);
  }

  destroyDrop() {
    const dropElement = this.getDropElement();
    if (!dropElement) {
      console.warn('ReplaceDataModal.destroyDrop: drag element not available');
      return;
    }
    dropElement.removeEventListener('dragenter', this.onFileDragEnter);
    dropElement.removeEventListener('dragleave', this.onFileDragLeave);
    // dropElement.removeEventListener('dragend', this.onFileEndDrag);
    dropElement.removeEventListener('dragover', this.onFileDragOver);
    dropElement.removeEventListener('drop', this.onFileDrop);

    this.onFileStartDrag = null;
    this.onFileDragLeave = null;
    this.onFileDrop = null;
  }

  @action
  registerModalBody(element) {
    this.modalContentElement = element.closest('.modal-content');
    // FIXME: czy jest wspierane pokazywanie i chowanie jeśli nie nieszczymy komponentu?
    // jeśli tak, to initDrop/destroyDrop powinny być robione za każdym razem jak otwieramy/zamykami
    this.initDrop();
  }

  /**
   * @param {HTMLInputElement} element
   */
  @action
  registerFileInput(element) {
    this.fileInputElement = element;
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
    this.args.modalApi.close();
  }

  @action
  download() {
    this.browserModel.downloadFiles([this.file]);
  }

  @action
  proceed() {
    if (this.proceedDisabled) {
      return;
    }
    this.newFile.onedataReplacedFile = this.file;
    this.uploadManager.getResumable().addFile(this.newFile);
    this.close();
  }
}
