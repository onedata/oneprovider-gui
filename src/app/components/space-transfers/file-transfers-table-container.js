/**
 * Extension of transfers-table-container for file transfers table
 * 
 * @module components/space-transfers/file-transfers-table-container
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import TransfersTableContainer from 'oneprovider-gui/components/space-transfers/transfers-table-container';
import { resolve, reject } from 'rsvp';
import layout from 'oneprovider-gui/templates/components/space-transfers/transfers-table-container';

export default TransfersTableContainer.extend({
  layout,

  /**
   * @override
   */
  fetchTransfers(startIndex, size, offset, array) {
    const {
      transferManager,
      file,
    } = this.getProperties('transferManager', 'file');
    if (startIndex == null) {
      if (size <= 0 || offset < 0) {
        return resolve([]);
      } else {
        return transferManager.getTransfersForFile(file, true)
          .then(({ ongoingIds, endedIds }) => {
            return [...ongoingIds, ...endedIds];
          });
      }
    } else if (startIndex === array.get('sourceArray.lastObject.index')) {
      return resolve([]);
    } else {
      return reject('cannot use fetch file transfer not from start');
    }
  },
});
