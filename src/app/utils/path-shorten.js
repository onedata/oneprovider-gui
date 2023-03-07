/**
 * Reduces length of the array by replacing multiple items from the middle by single
 * `ellipsisItem`. See `tests/unit/utils/path-shorten-test` for examples of input/output.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

export default function pathShorten(array, ellipsisItem, targetLength = 0) {
  if (typeof (targetLength) !== 'number' || targetLength < 0) {
    return [];
  }
  if (targetLength <= 0) {
    return [];
  } else if (targetLength === 1) {
    return [array[0]];
  } else {
    const frontCount = Math.min(
      Math.floor(targetLength / 2),
      Math.ceil(array.length / 2)
    );
    const tailCount = Math.min(
      Math.floor((targetLength - 1) / 2),
      Math.floor(array.length / 2),
    );
    const head = array.slice(0, frontCount);
    const tail = array.slice(
      array.length - tailCount,
      array.length,
    );
    if (targetLength > array.length) {
      return [...head, ...tail];
    } else {
      return [...head, ellipsisItem, ...tail];
    }
  }
}
