/**
 * Provides model functions related to files and directories.
 * 
 * @module services/file-manager
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';

export default Service.extend({
  store: service(),

  /**
   * Creates new file or directory
   * @param {string} type `file` or `dir`
   * @param {string} name 
   * @param {Models.File} parent 
   * @param {number} [createAttempts=undefined]
   * @returns {Promise<Models.File>}
   */
  createFileOrDirectory(type, name, parent, createAttempts = undefined) {
    let _meta;
    if (createAttempts) {
      _meta = {
        createRequestFields: {
          createAttempts,
        },
      };
    }

    return this.get('store').createRecord('file', {
      type,
      name,
      parent,
      _meta,
    }).save();
  },

  /**
   * Creates new file
   * @param {string} name 
   * @param {Models.File} parent 
   * @param {number} [createAttempts=undefined]
   * @returns {Promise<Models.File>}
   */
  createFile(name, parent, createAttempts = undefined) {
    return this.createFileOrDirectory('file', name, parent, createAttempts);
  },

  /**
   * Creates new directory
   * @param {string} name 
   * @param {Models.File} parent 
   * @param {number} [createAttempts=undefined]
   * @returns {Promise<Models.File>}
   */
  createDirectory(name, parent, createAttempts = undefined) {
    return this.createFileOrDirectory('dir', name, parent, createAttempts);
  },
});
