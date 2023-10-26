/**
 * This serializer is currently only for modifying invalid API.
 *
 * TODO: VFS-11452 path is now including space root, which will be changed
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Serializer from 'onedata-gui-websocket-client/serializers/application';
import { oneArchivesRootDirName } from 'oneprovider-gui/utils/file-archive-info';

const archivesPrefixPathRe = new RegExp(`^/.*?/${oneArchivesRootDirName}(/|$)`);

export default Serializer.extend({
  /**
   * @override
   */
  normalize(typeClass, hash) {
    this.normalizeData(hash);
    return this._super(typeClass, hash);
  },

  // TODO: VFS-11452 path is now including space root, which will be changed
  normalizeData(hash) {
    if (hash.dataSourceType === 'file' && this.isInArchivePath(hash.dataSourceName)) {
      hash.dataSourceName = hash.dataSourceName.replace(/\/.*?\//, '/');
    }
    return hash;
  },

  /**
   * @param {string} path
   * @returns {boolean}
   */
  isInArchivePath(path) {
    return archivesPrefixPathRe.test(path);
  },
});
