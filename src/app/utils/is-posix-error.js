/**
 * Detect if error is POSIX-type with optional POSIX error type checking.
 *
 * @module utils/is-posix-error
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

export default function isPosixError(error, posixType) {
  if (error && error.id === 'posix') {
    if (posixType) {
      if (error.details && error.details.errno === posixType) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  } else {
    return false;
  }
}
