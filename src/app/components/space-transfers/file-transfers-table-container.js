/**
 * Extension of transfers-table-container for file transfers table
 * 
 * @module components/space-transfers/file-transfers-table-container
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import TransfersTableContainer from 'oneprovider-gui/components/space-transfers/transfers-table-container';
import { resolve, reject } from 'rsvp';
import layout from 'oneprovider-gui/templates/components/space-transfers/transfers-table-container';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default TransfersTableContainer.extend(I18n, {
  layout,

  onedataConnection: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceTransfers.fileTransfersTableContainer',

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
          .then(({ ongoingTransfers, endedTransfers }) => {
            return [...ongoingTransfers, ...endedTransfers];
          });
      }
    } else if (startIndex === array.get('sourceArray.lastObject.index')) {
      return resolve([]);
    } else {
      return reject('cannot use fetch file transfer not from start');
    }
  },

  /**
   * Max number of ended transfers that can be fetched for transfer
   * @type {ComputedProperty<number>}
   */
  historyLimitPerFile: reads('onedataConnection.transfersHistoryLimitPerFile'),

  /**
   * True if the `endedTransfersCount` reached history limit
   * @type {ComputedProperty<boolean>}
   */
  historyLimitReached: computed(
    'historyLimitPerFile',
    'endedTransfersCount',
    'transfersArray.{endIndex,sourceArray.length}',
    function historyLimitReached() {
      const {
        historyLimitPerFile,
        endedTransfersCount,
        transfersArray,
      } = this.getProperties('historyLimitPerFile', 'endedTransfersCount', 'transfersArray');
      const endIndex = get(transfersArray, 'endIndex');
      const sourceEndIndex = get(transfersArray, 'sourceArray.length') - 1;
      const isEnd = endIndex >= sourceEndIndex;
      return isEnd && endedTransfersCount >= historyLimitPerFile;
    }
  ),

  /**
   * Number of loaded ended transfers for file tab.
   * @type {ComputedProperty<number>}
   */
  endedTransfersCount: computed(
    'transfersArray.sourceArray.@each.finishTime',
    function endedTransfersCount() {
      const allFileTransfers = this.get('transfersArray.sourceArray');
      if (allFileTransfers) {
        return get(allFileTransfers.filterBy('finishTime'), 'length');
      }
    }
  ),
});
