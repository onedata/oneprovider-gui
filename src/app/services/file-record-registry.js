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
import _ from 'lodash';

export default Service.extend({
  store: service(),

  //#region state

  /**
   * Maps file GRI to set of its FileConsumers.
   * @type {Map<string, Set<FileConsumer>>}
   */
  fileGriConsumerMap: undefined,

  //#endregion

  init() {
    this._super(...arguments);
    this.set('fileGriConsumerMap', new Map());
    // FIXME: debug code
    ((name) => {
      window[name] = this;
      console.log(`window.${name}`, window[name]);
    })('debug_file_record_registry');
  },

  /**
   * @public
   * @param {FileConsumer} consumer
   * @param {...string} fileGris
   * @returns {void}
   */
  setFileGris(consumer, ...fileGris) {
    const currentConsumerFileGris = this.getFileGrisForConsumer(consumer);
    const fileGrisToDeregister = [];
    const fileGrisToRegister = [];

    // Will deregister files that are not in the new files.
    for (const currentFileGri of currentConsumerFileGris) {
      if (!fileGris.includes(currentFileGri)) {
        fileGrisToDeregister.push(currentFileGri);
      }
    }
    // Will register only files that are not in the current files.
    for (const newFile of fileGris) {
      if (!currentConsumerFileGris.has(newFile)) {
        fileGrisToRegister.push(newFile);
      }
    }

    if (fileGrisToDeregister.length) {
      this.deregisterFileGris(consumer, ...fileGrisToDeregister);
    }
    for (const fileGri of fileGrisToRegister) {
      this.addToMap(fileGri, consumer);
    }
  },

  /**
   * @public
   * @param {FileConsumer} consumer
   * @param {...string} fileGris
   * @returns {void}
   */
  deregisterFileGris(consumer, ...fileGris) {
    if (fileGris.length) {
      for (const file of fileGris) {
        const consumers = this.fileGriConsumerMap.get(file);
        if (consumers) {
          consumers.delete(consumer);
          if (!consumers.size) {
            this.fileGriConsumerMap.delete(file);
          }
        }
      }
    } else {
      for (const [file, consumers] of this.fileGriConsumerMap) {
        consumers.delete(consumer);
        if (!consumers.size) {
          this.fileGriConsumerMap.delete(file);
        }
      }
    }
  },

  /**
   * @public
   * @returns {Array<Models.File>}
   */
  getRegisteredFiles() {
    return _.compact([...this.fileGriConsumerMap.keys()].map(fileGri => {
      const file = this.store.peekRecord('file', fileGri);
      if (!file || file.isDestroyed || file.isDestroying) {
        return null;
      }
      return file;
    }));
  },

  /**
   * // FIXME: fileGri
   * @public
   * @param {FileConsumer} consumer
   * @returns {Set<Models.File>}
   */
  getFileGrisForConsumer(consumer) {
    const fileGris = new Set();
    for (const [fileGri, consumers] of this.fileGriConsumerMap.entries()) {
      if (consumers.has(consumer)) {
        fileGris.add(fileGri);
      }
    }
    return fileGris;
  },

  /**
   * @private
   * @param {FileConsumer} consumer
   * @param {string} fileGri
   * @returns {void}
   */
  addToMap(fileGri, consumer) {
    /** @type Set<FileConsumer> */
    let consumers = this.fileGriConsumerMap.get(fileGri);
    if (!consumers) {
      consumers = new Set();
      this.fileGriConsumerMap.set(fileGri, consumers);
    }
    consumers.add(consumer);
  },
});
