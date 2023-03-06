/**
 * Check if error indicates that some resource has been deleted or cannot be fetched.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import isDeletedEmberError from 'onedata-gui-websocket-client/utils/is-deleted-ember-error';
import isPosixError from 'oneprovider-gui/utils/is-posix-error';

export default function isNotFoundError(error) {
  return error && Boolean(
    error.id === 'notFound' || isDeletedEmberError(error) || isPosixError(error, 'enoent')
  ) || false;
}
