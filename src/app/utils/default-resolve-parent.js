/**
 * Default method for getting browsable object parent
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { get } from '@ember/object';

export default async function defaultResolveParent(item) {
  if (get(item, 'hasParent')) {
    return get(item, 'parent');
  } else {
    return null;
  }
}
