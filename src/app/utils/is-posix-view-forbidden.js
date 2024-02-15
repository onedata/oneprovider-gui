/**
 * Check posix permissions and return if view is forbidden
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { get } from '@ember/object';
import { EntityPermissions } from 'oneprovider-gui/utils/posix-permissions';

export default function isPosixViewForbidden(file, octalNumber) {
  const posixPermissions = get(file, 'posixPermissions');
  if (!posixPermissions) {
    return false;
  }
  const entityPermissions = EntityPermissions.create()
    .fromOctalRepresentation(posixPermissions[octalNumber]);
  if (get(file, 'type') === 'file') {
    return !get(entityPermissions, 'read');
  } else {
    return !get(entityPermissions, 'read') || !get(entityPermissions, 'execute');
  }
}
