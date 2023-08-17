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
    this.removeFiles(consumer);
    for (const file of files) {
      this.addToMap(file, consumer);
    }
  },

  /**
   * @public
   * @param {FileConsumer} consumer
   * @param {...Models.File} files
   * @returns {void}
   */
  removeFiles(consumer, ...files) {
    if (files.length) {
      for (const file of files) {
        const consumers = this.fileConsumerMap.get(file);
        if (consumers) {
          consumers.delete(consumer);
          if (!consumers.size) {
            this.fileConsumerMap.delete(file);
            this.store.unloadRecord(file);
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
   * @returns {Set<Models.File>}
   */
  getRegisteredFiles() {
    return [...this.fileConsumerMap.keys()];
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
