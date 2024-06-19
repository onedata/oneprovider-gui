/**
 * Creates TransferTableRecord instance. Destroys the record automatically.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Helper from '@ember/component/helper';
import TransferTableRecord from 'oneprovider-gui/utils/transfer-table-record';

export default class TransferTableRecordHelper extends Helper {
  recordCache = undefined;

  compute(positional, hash) {
    this.recordCache?.destroy();
    return this.set('recordCache', TransferTableRecord.create(hash));
  }

  /**
   * @override
   */
  willDestroy() {
    try {
      this.recordCache?.destroy();
    } finally {
      super.willDestroy();
    }
  }
}
