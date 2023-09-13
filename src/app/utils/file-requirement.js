/**
 * Specifies which properties (FileModel.Property) are needed by which files (using
 * FileQuery conditions).
 *
 * FileRequirements are created to be finally registered in FileRequirementRegistry, but
 * as a class user you should specify them with Mixin.FileConsumer - see its documentation
 * for details.
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FileQuery from 'oneprovider-gui/utils/file-query';

export default class FileRequirement extends FileQuery {
  constructor(options = {}) {
    super(options);

    if (!Array.isArray(options.properties)) {
      throw new Error('FileRequirement properties must be an Array');
    }

    /**
     * Properties that should be available for file record matching the query.
     * @virtual
     * @type {Array<FileModel.Property>}
     */
    this.properties = options.properties;
  }

  /**
   * @override
   * @returns {string}
   */
  toString() {
    const fileQueryString = super.toString(...arguments);
    const propertiesString = [...this.properties].sort().join(',');
    return `<FileRequirement:${fileQueryString}|properties:${propertiesString}>`;
  }

  /**
   * @param {Utils.FileRequirement} otherRequirement
   * @returns boolean
   */
  isEqual(otherRequirement) {
    return this.toString() === otherRequirement?.toString();
  }
}
