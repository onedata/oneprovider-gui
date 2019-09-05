/**
 * Create an array with directories in path from root dir for file (or directory).
 * 
 * @module utils/resolve-file-path
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { get } from '@ember/object';
import { resolve } from 'rsvp';

export function resolveParent(dir, array) {
  if (get(dir, 'hasParent')) {
    return get(dir, 'parent').then(parent => {
      array.unshift(parent);
      return resolveParent(parent, array);
    });
  } else {
    return resolve(array);
  }
}

export default function resolveFilePath(file) {
  const array = [file];
  return resolveParent(file, array);
}
