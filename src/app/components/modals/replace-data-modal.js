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

  /** @type {DropHandler} */
  dropHandler;

  constructor() {
    super(...arguments);
    this.reset();
  }

  /** @override */
  willDestroy() {
    this.dropHandler?.destroy();
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

  /**
   * @param {File} file
   */
  setNewFile(file) {
    this.newFile = file;
  }

  @action
  registerModalBody(element) {
    const modalContentElement = element.closest('.modal-content');
    this.dropHandler = new DropHandler(modalContentElement, this.setNewFile.bind(this));
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
  changeFileUsingInput() {
    this.setNewFile(this.fileInputElement.files[0]);
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

class DropHandler {
  /** @type {(file: File) => void} */
  onFileDropped;

  /**
   * @type {HTMLElement}
   * @private
   */
  dropElement;

  /**
   * @type {HTMLElement|null}
   * @private
   */
  lastDropElement = null;

  /**
   * @type {Object<string, (event: DropEvent) => void>}
   * @private
   */
  handlers;

  /**
   * @param {HTMLElement} dropElement
   * @param {(file: File) => void} onFileDropped
   */
  constructor(dropElement, onFileDropped) {
    if (!dropElement) {
      console.error('ReplaceDataModal.initDrop: drag element not provided');
      return;
    }

    this.dropElement = dropElement;
    this.onFileDropped = onFileDropped;

    this.handlers = {
      dragenter: this.onDragEnter.bind(this),
      dragleave: this.onDragLeave.bind(this),
      dragover: this.onDragOver.bind(this),
      drop: this.onDrop.bind(this),
    };

    for (const [eventName, handler] of Object.entries(this.handlers)) {
      this.dropElement.addEventListener(eventName, handler);
    }
  }

  /**
   * @param {boolean} shown
   */
  toggleDropZone(shown) {
    this.dropElement.classList[shown ? 'add' : 'remove']('file-drag');
  }

  /**
   * @param {DragEvent} event
   */
  onDragEnter(event) {
    this.lastDropElement = event.target;
    this.toggleDropZone(true, !this.getDraggedFile(event));
  }

  /**
   * @param {DragEvent} event
   */
  onDragLeave(event) {
    if (event.target == this.lastDropElement) {
      this.toggleDropZone(false);
    }
  }

  /**
   * @param {DragEvent} event
   */
  onDrop(event) {
    try {
      event.preventDefault();
      this.handleDroppedItem(event);
    } finally {
      this.toggleDropZone(false);
    }
  }

  /**
   * @param {DragEvent} event
   */
  onDragOver(event) {
    event.preventDefault();
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
      this.onFileDropped(file);
      this.newFile = file;
    }
  }

  destroy() {
    if (!this.dropElement) {
      console.warn('DropHandler.destroy: dropElement element not available');
      return;
    }

    for (const [eventName, handler] of Object.entries(this.handlers)) {
      this.dropElement.removeEventListener(eventName, this[handler]);
    }
  }
}
