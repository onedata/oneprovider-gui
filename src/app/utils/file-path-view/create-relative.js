/**
 * Creates array of FilePathItem objects to use in `file-path-renderer` component for
 * relative path.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { directorySeparator as renderedDirectorySeparator } from 'oneprovider-gui/components/file-path-renderer';
import { directorySeparator as rawDirectorySeparator } from 'onedata-gui-common/utils/file';

/**
 * @param {string} stringPath Relative path to file, eg. `hello/world/foo/bar.txt`.
 *   Should not contain leading dir separator (`/`).
 * @returns {Array<FilePathItem>}
 */
export default function createRelative(stringPath) {
  const allFileNames = stringPath.split(rawDirectorySeparator);
  const simpleFilePath = allFileNames.map(name => ({ name }));
  const items = simpleFilePath.map(simpleFile => {
    return {
      itemType: 'file',
      separator: renderedDirectorySeparator,
      record: simpleFile,
    };
  });
  if (items[0]) {
    delete items[0].separator;
  }
  return items;
}
