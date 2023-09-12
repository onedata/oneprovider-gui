/**
 * FIXME: doc
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FileQuery from 'oneprovider-gui/utils/file-query';

// FIXME: przenieść do serializera/file?

/**
 * @typedef {typeof possibleFileProperties[number]} FileModel.Property
 */

const FileRequirement = FileQuery.extend({
  /**
   * FIXME: doc
   * @virtual
   * @type {Array<FileModel.Property>}
   */
  properties: undefined,

  /**
   * @returns {string}
   */
  stringify() {
    const fileQueryString = this._super(...arguments);
    const propertiesString = [...this.properties].sort().join(',');
    return `<FileRequirement:${fileQueryString}|properties:${propertiesString}>`;
  },

  /**
   * @param {Utils.FileRequirement} otherRequirement
   * @returns boolean
   */
  isEqual(otherRequirement) {
    return this.stringify() === otherRequirement?.stringify();
  },
});

export default FileRequirement;
