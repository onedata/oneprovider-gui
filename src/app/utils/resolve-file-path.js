/**
 * Create an array with directories in path from root dir for file (or directory).
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { resolve } from 'rsvp';
import defaultResolveParent from 'oneprovider-gui/utils/default-resolve-parent';

export const dirSeparator = '/';

export function resolveParent(
  dir,
  dirsOnPathToRoot,
  resolveFileParentFun = defaultResolveParent
) {
  return resolveFileParentFun(dir).then(parent => {
    if (parent) {
      dirsOnPathToRoot.unshift(parent);
      return resolveParent(parent, dirsOnPathToRoot, resolveFileParentFun);
    } else {
      return resolve(dirsOnPathToRoot);
    }
  });
}

export function stringifyFilePath(
  path,
  nameProperty = 'name',
  separator = dirSeparator,
  showLeadingSeparator = true
) {
  return (showLeadingSeparator ? separator : '') +
    path.mapBy(nameProperty).join(separator);
}

export default function resolveFilePath(file, resolveFileParentFun) {
  const dirsOnPathToRoot = [file];
  return resolveParent(file, dirsOnPathToRoot, resolveFileParentFun);
}
