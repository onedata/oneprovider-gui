/**
 * Helper class with loading data capabilities for displaying single file data in QoS
 * modal.
 * 
 * @module utils/qos-modal-file-item
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { get, computed } from '@ember/object';
import { resolve, all as allFulfilled } from 'rsvp';
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
   * @type {Service}
   */
  store: undefined,

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @override
   */
  fetchFileQosSummary() {
    const {
      store,
      file,
    } = this.getProperties('store', 'file');
    const fileQosSummaryGri = file.belongsTo('fileQos').id();
    // in case, there were error when fetching the relation last time (eg. forbidden)
    const prePromise = fileQosSummaryGri ?
      resolve(fileQosSummaryGri) :
      file.reload().then(file => file.belongsTo('fileQos').id());
    return prePromise
      .then(gri => store.findRecord('fileQosSummary', gri, { reload: true }));
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
    const file = this.get('file');
    return this.updateFileQosSummaryProxy({ replace: true }).then(fileQosSummary =>
      this.updateQosRecordsProxy({ replace: true, fetchArgs: [true] }).then(qosRecords =>
        allFulfilled(qosRecords.map(qos => get(qos, 'file').then(qosSourceFile =>
          QosItem.create({
            modalFileId: get(file, 'entityId'),
            qosSourceFile,
            fileQosSummary,
            qos,
          })
        )))
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
        return get(fileQosSummaryProxy, 'content.fulfilled') ? 'fulfilled' : 'pending';
      }
    }
  ),
});
