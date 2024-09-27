/**
 * Returns a string that should be displayed for xattr value, which can be technically
 * any JSON value (e.g. a number).
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

export default function stringifyXattrValue(value) {
  if (value == null) {
    return undefined;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}
