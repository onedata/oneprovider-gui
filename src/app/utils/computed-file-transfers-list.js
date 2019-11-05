/**
 * A computed property that creates FakeListRecordRelation with transfers list
 * filtered for given `fileId`.
 *
 * @module utils/computed-file-transfers-list
 * @author Jakub Liput
 * @copyright (C) 2018 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import ReplacingChunksArray from 'onedata-gui-common/utils/replacing-chunks-array';
import FakeListRecordRelation from 'oneprovider-gui/utils/fake-list-record-relation';
import { computed } from '@ember/object';

/**
 * @function
 * @param {string} type one of: waiting, ongoing, ended
 * @returns {FakeListRecordRelation}
 */
export default function computedFileTransfersList() {
  return computed(function () {
    const fileId = this.get('id');
    const initChunksArray = ReplacingChunksArray.create({
      fetch: (...args) => this.fetchTransfers(fileId, ...args),
      startIndex: 0,
      endIndex: 10000,
      indexMargin: 10,
      chunkSize: 10000,
    });
    return FakeListRecordRelation.create({ initChunksArray });
  });
}
