/**
 * Contains util functions related to symlinks.
 *
 * @module utils/symlink-utils
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

const prefixedSymlinkPathRegexp = /^<__onedata_space_id:([^>]+)>(.*)$/;

/**
 * @param {String} spaceId
 * @returns {String}
 */
export function generateAbsoluteSymlinkPathPrefix(spaceId) {
  return `<__onedata_space_id:${spaceId}>`;
}

/**
 * @param {String} symlinkPath
 * @returns {null|{ spaceId: String, path: String }}
 */
export function extractDataFromPrefixedSymlinkPath(symlinkPath) {
  const prefixMatchResult =
    (symlinkPath || '').match(prefixedSymlinkPathRegexp);
  if (!prefixMatchResult) {
    return null;
  }

  return {
    spaceId: prefixMatchResult[1],
    path: prefixMatchResult[2] || '',
  };
}
