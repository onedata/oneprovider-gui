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

import { get } from '@ember/object';

/**
 * @typedef {'parentId'|'fileGri'|'none'} FileQuery.Type
 */

export default class FileQuery {
  constructor(conditions = {}) {
    if (conditions.parentId && conditions.fileGri) {
      throw new Error(
        'FileQuery should have only one of these properties: parentId or fileGri'
      );
    }

    /**
     * Entity ID of parent of file to match.
     * @virtual optional
     * @type {undefined|string}
     */
    this.parentId = conditions.parentId;

    /**
     * Exact GRI of file to match.
     * @virtual optional
     * @type {undefined|string}
     */
    this.fileGri = conditions.fileGri;
  }

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
  }

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
  }

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
  }

  /**
   * @public
   * @returns {string}
   */
  toString() {
    const type = this.getQueryType();
    let condition;
    if (type === 'parentId') {
      condition = this.parentId;
    } else if (type === 'fileGri') {
      condition = this.fileGri;
    }
    return `<FileQuery:${type}${condition ? '-' : ''}${condition ?? ''}>`;
  }
}
