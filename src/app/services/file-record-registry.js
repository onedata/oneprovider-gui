/**
 * Stores collection of file records that are used with the file requirement flow to help
 * FileRequirementRegistry managing requirements changes for already loaded files.
 *
 * There are FileConsumers in the app - entities (eg. components) that use file records. A
 * FileConsumer uses a set of files and these files could need specific properties of file
 * model. Each FileConsumer should register a set of Files that are used in the consumer
 * and these registered files are taken into account when requirements are changed in the
 * FileRequirementRegistry - when there is a change that causes loaded records to
 * have new properties, the files should be reloaded. When the consumer is destroyed, the
 * files should be deregistered, so the change of requirements should not cause these
 * files to be reloaded anymore.
 *
 * This registry does not reload files by itself - it is used only by other services
 * to get the registered files.
 *
 * See `Mixin.FileConsumer` documentation to implement the FileConsumer and use this
 * registry in a convenient way. The registry typically should not be used directly, but
 * by using `Mixin.FileConsumer`.
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

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
    // FIXME: debug code
    ((name) => {
      window[name] = this;
      console.log(`window.${name}`, window[name]);
    })('debug_file_record_registry');
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
