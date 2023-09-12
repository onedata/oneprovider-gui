// FIXME: jsdoc

import Service, { inject as service } from '@ember/service';

export default Service.extend({
  store: service(),

  //#region state

  /**
   * @type {Map<Models.File, Set<FileConsumer>>}
   */
  fileConsumerMap: undefined,

  //#endregion

  init() {
    this._super(...arguments);
    this.set('fileConsumerMap', new Map());
  },

  /**
   * @public
   * @param {FileConsumer} consumer
   * @param {...Models.File} files
   * @returns {void}
   */
  setFiles(consumer, ...files) {
    const currentConsumerFiles = this.getFilesForConsumer(consumer);
    const filesToDeregister = [];
    const filesToRegister = [];

    // Will deregister files that are not in the new files.
    for (const currentFile of currentConsumerFiles) {
      if (!files.includes(currentFile)) {
        filesToDeregister.push(currentFile);
      }
    }
    // Will register only files that are not in the current files.
    for (const newFile of files) {
      if (!currentConsumerFiles.has(newFile)) {
        filesToRegister.push(newFile);
      }
    }

    if (filesToDeregister.length) {
      this.deregisterFiles(consumer, ...filesToDeregister);
    }
    for (const file of filesToRegister) {
      this.addToMap(file, consumer);
    }
  },

  // FIXME: zmiana nazwy (i pewnie też w requirementsach) bo deregisterFiles brzmi jak ich usuwanie (delete)
  /**
   * @public
   * @param {FileConsumer} consumer
   * @param {...Models.File} files
   * @returns {void}
   */
  deregisterFiles(consumer, ...files) {
    if (files.length) {
      for (const file of files) {
        const consumers = this.fileConsumerMap.get(file);
        if (consumers) {
          consumers.delete(consumer);
          if (!consumers.size) {
            this.fileConsumerMap.delete(file);
          }
        }
      }
    } else {
      for (const [file, consumers] of this.fileConsumerMap) {
        consumers.delete(consumer);
        if (!consumers.size) {
          this.fileConsumerMap.delete(file);
        }
      }
    }
  },

  /**
   * @public
   * @returns {Array<Models.File>}
   */
  getRegisteredFiles() {
    return [...this.fileConsumerMap.keys()];
  },

  /**
   * @public
   * @param {FileConsumer} consumer
   * @returns {Set<Models.File>}
   */
  getFilesForConsumer(consumer) {
    const files = new Set();
    for (const [file, consumers] of this.fileConsumerMap.entries()) {
      if (consumers.has(consumer)) {
        files.add(file);
      }
    }
    return files;
  },

  /**
   * FIXME: nie jest na razie używane, do użycia przez garbage collector
   * @private
   * @param {Models.File} file
   */
  clearFileEntry(file) {
    this.fileConsumerMap.delete(file);
    if (!this.store.isDestroyed && !this.store.isDestroying) {
      this.store.unloadRecord(file);
    }
  },

  /**
   * @private
   * @param {FileConsumer} consumer
   * @param {Models.File} file
   * @returns {void}
   */
  addToMap(file, consumer) {
    /** @type Set<FileConsumer> */
    let consumers = this.fileConsumerMap.get(file);
    if (!consumers) {
      consumers = new Set();
      this.fileConsumerMap.set(file, consumers);
    }
    consumers.add(consumer);
  },
});
