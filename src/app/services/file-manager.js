import Service, { inject as service } from '@ember/service';

export default Service.extend({
  store: service(),

  /**
   * Creates new file or directory
   * @param {string} type `file` or `dir`
   * @param {string} name 
   * @param {Models.File} parent 
   * @param {number|undefined} createAttempts 
   * @returns {Promise<Models.File>}
   */
  createFileOrDirectory(type, name, parent, createAttempts) {
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
   * @param {number|undefined} createAttempts 
   * @returns {Promise<Models.File>}
   */
  createFile(name, parent, createAttempts) {
    return this.createFileOrDirectory('file', name, parent, createAttempts);
  },

  /**
   * Creates new directory
   * @param {string} name 
   * @param {Models.File} parent 
   * @param {number|undefined} createAttempts 
   * @returns {Promise<Models.File>}
   */
  createDirectory(name, parent, createAttempts) {
    return this.createFileOrDirectory('dir', name, parent, createAttempts);
  },
});
