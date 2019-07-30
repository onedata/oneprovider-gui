/**
 * Create a new pathsDir from other pathsDir, with new dir root.
 * @module utils/cut-dirs-path
 * @author Jakub Liput
 * @copyright (C) 2016 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { get } from '@ember/object';

/**
 * Cut dirs in path to create new root dir.
 *
 * @param {File[]} dirPath array of File objects represeting:
 *  original root dir > dir_1 > ... > file/dir_N
 * @param {File} rootDir one of dir_1 ... dir_N, that will become new root dir
 *  in result
 * @returns {File[]} dirsPath with new root
 */
export default function cutDirsPath(dirPath, rootDir) {
  const i = dirPath.map(dir => get(dir, 'id')).indexOf(get(rootDir, 'id'));
  return (i > -1) ? dirPath.slice(i) : dirPath;
}
