/**
 * FIXME: doc
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject from '@ember/object';

export default EmberObject.extend({
  /**
   * @virtual optional
   * @type {undefined|null|string}
   */
  parentGuid: undefined,

  /**
   * @virtual optional
   * @type {undefined|null|string}
   */
  fileGri: undefined,

  /**
   * @param {Utils.FileQuery} query
   * @returns {boolean}
   */
  matches(query) {
    if (!query) {
      return false;
    }
    return this.parentGuid === query.parentGuid && this.fileGri === query.fileGri;
  },
});
