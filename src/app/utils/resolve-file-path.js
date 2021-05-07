/**
 * Create an array with directories in path from root dir for file (or directory).
 *
 * @module utils/resolve-file-path
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { get } from '@ember/object';
import { resolve } from 'rsvp';

function defaultResolveParentFun(dir) {
  if (get(dir, 'hasParent')) {
    return get(dir, 'parent');
  } else {
    return resolve(null);
  }
}

export function resolveParent(
  dir,
  dirsOnPathToRoot,
  resolveFileParentFun = defaultResolveParentFun) {
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
  separator = '/',
  showLeadingSeparator = true
) {
  return (showLeadingSeparator ? separator : '') +
    path.mapBy(nameProperty).join(separator);
}

export default function resolveFilePath(file, resolveFileParentFun) {
  const dirsOnPathToRoot = [file];
  return resolveParent(file, dirsOnPathToRoot, resolveFileParentFun);
}
