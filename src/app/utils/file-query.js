/**
 * Specifies which file or a set of files should be chosen from some set of files.
 * Used in pair with FileRequirement (which is its subclass) to match file requirements.
 *
 * When constructed, one of the properties should be specified:
 * - `parentId` - to match files by parent they have,
 * - `fileGri` - to match file by its exact GRI (record ID).
 *
 * There is also a special type of query - "none" type query, that will match all files,
 * which can be created by not providing any of above conditions. You should not use
 * the "none"-typed query - it is used only for adding basic requirements to file.
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { get } from '@ember/object';

/**
 * @typedef {'parentId'|'fileGri'|'none'} FileQuery.Type
 */

const FileQuery = EmberObject.extend({
  /**
   * Entity ID of parent of file to match.
   * @virtual optional
   * @type {undefined|string}
   */
  parentId: undefined,

  /**
   * Exact GRI of file to match.
   * @virtual optional
   * @type {undefined|string}
   */
  fileGri: undefined,

  init() {
    this._super(...arguments);
    if (this.parentId && this.fileGri) {
      throw new Error(
        'FileQuery should have only one of these properties: parentId or fileGri'
      );
    }
  },

  /**
   * @public
   * @param {Utils.FileQuery} query
   * @returns {boolean}
   */
  matches(query) {
    if (!query) {
      return false;
    }
    if (this.parentId && query.parentId) {
      return this.parentId === query.parentId;
    }
    if (this.fileGri && query.fileGri) {
      return this.fileGri === query.fileGri;
    }
    // one of the query is all-match query
    if (this.getQueryType() === 'none' || query.getQueryType() === 'none') {
      return true;
    }
    return false;
  },

  /**
   * @public
   * @param {Models.File} file
   * @returns {boolean}
   */
  matchesFile(file) {
    if (!file) {
      return false;
    }
    switch (this.getQueryType()) {
      case 'fileGri':
        return get(file, 'id') === this.fileGri;
      case 'parentId':
        return file.relationEntityId('parent') === this.parentId;
      case 'none':
        return true;
      default:
        return false;
    }
  },

  /**
   * @public
   * @returns {FileQuery.Type}
   */
  getQueryType() {
    if (this.parentId) {
      return 'parentId';
    }
    if (this.fileGri) {
      return 'fileGri';
    }
    return 'none';
  },

  /**
   * @public
   * @returns {string}
   */
  stringify() {
    const type = this.getQueryType();
    let condition;
    if (type === 'parentId') {
      condition = this.parentId;
    } else if (type === 'fileGri') {
      condition = this.fileGri;
    }
    return `<FileQuery:${type}${condition ? '-' : ''}${condition ?? ''}>`;
  },
});

export default FileQuery;
