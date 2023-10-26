/**
 * Check if the provided `record` is a file record - instance of File Model.
 * Could be also a file wrapped into BrowsableWrapper, because it delegates model methods.
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BrowsableWrapper from 'oneprovider-gui/utils/browsable-wrapper';

export default function isFileRecord(record) {
  if (!record || typeof record !== 'object') {
    return false;
  }
  if (record.constructor?.modelName === 'file') {
    return true;
  }
  if (record instanceof BrowsableWrapper) {
    return record.content?.constructor?.modelName === 'file';
  }
  return false;
}
