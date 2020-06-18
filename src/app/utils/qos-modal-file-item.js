/**
 * Helper class with loading data capabilities for displaying single file data in QoS
 * modal.
 * 
 * @module utils/qos-modal-file-item
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { get, set, computed } from '@ember/object';
import { all as allFulfilled } from 'rsvp';
import QosItem from 'oneprovider-gui/utils/qos-item';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';

const objectMixins = [
  createDataProxyMixin('fileQosSummary'),
  createDataProxyMixin('qosRecords'),
  createDataProxyMixin('qosItems'),
];

export default EmberObject.extend(...objectMixins, {
  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * Initialized on init.
   * Stores mapping of QoS entityId -> QosItem.
   * @type {Map}
   */
  qosItemsCache: undefined,

  /**
   * @override
   */
  fetchFileQosSummary() {
    return this.get('file').getRelation('fileQosSummary');
  },

  /**
   * @override
   */
  fetchQosRecords(replace) {
    // NOTE: not need to update qos records separately
    // in this modal, because their fulfilled property
    // is not used (using per-file map in fileQosSummary)
    return this.updateFileQosSummaryProxy({ replace }).then(fileQosSummary =>
      fileQosSummary.updateQosRecordsProxy({ replace: true })
    );
  },

  /**
   * @override
   */
  fetchQosItems() {
    const {
      file,
      qosItemsCache,
    } = this.getProperties('file', 'qosItemsCache');
    return this.updateFileQosSummaryProxy({ replace: true }).then(fileQosSummary =>
      this.updateQosRecordsProxy({ replace: true, fetchArgs: [true] }).then(qosRecords =>
        allFulfilled(qosRecords.map(qos => get(qos, 'file').then(qosSourceFile => {
          const qosId = get(qos, 'entityId');
          if (qosItemsCache.has(qosId)) {
            const qosItem = qosItemsCache.get(qosId);
            set(qosItem, 'fileQosSummary', fileQosSummary);
            return qosItem;
          } else {
            const qosItem = QosItem.create({
              modalFileId: get(file, 'entityId'),
              qosSourceFile,
              fileQosSummary,
              qos,
            });
            qosItemsCache.set(qosId, qosItem);
            return qosItem;
          }
        })))
      )
    );
  },

  fileQosStatus: computed(
    'qosItemsProxy.{content,isSettled}',
    'fileQosSummaryProxy.{content,isSettled}',
    function fileQosStatus() {
      const {
        qosItemsProxy,
        fileQosSummaryProxy,
      } = this.getProperties('qosItemsProxy', 'fileQosSummaryProxy');

      if (get(qosItemsProxy, 'isPending')) {
        return 'loading';
      } else if (get(qosItemsProxy, 'isRejected')) {
        return 'error';
      } else if (get(qosItemsProxy, 'length') === 0) {
        return 'empty';
      } else if (get(fileQosSummaryProxy, 'isPending')) {
        return 'loading';
      } else if (get(fileQosSummaryProxy, 'isRejected')) {
        return 'error';
      } else {
        return get(fileQosSummaryProxy, 'content.status');
      }
    }
  ),

  init() {
    this._super(...arguments);
    this.set('qosItemsCache', new Map());
  },
});
