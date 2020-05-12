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

const FileItemBase = EmberObject.extend(
  createDataProxyMixin('fileQosSummary'),
  createDataProxyMixin('qosRecords'),
  createDataProxyMixin('qosItems'),
);

export default FileItemBase.extend({
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
    'qosItemsProxy.{content}',
    'fileQosSummaryProxy.{content}',
    function fileQosStatus() {
      const qosItemsProxy = this.get('qosItemsProxy');
      if (get(qosItemsProxy, 'isSettled')) {
        if (get(qosItemsProxy, 'isFulfilled')) {
          if (get(qosItemsProxy, 'length') === 0) {
            return 'empty';
          } else {
            const fileQosSummaryProxy = this.get('fileQosSummaryProxy');
            if (get(fileQosSummaryProxy, 'isSettled')) {
              if (get(fileQosSummaryProxy, 'isFulfilled')) {
                if (get(fileQosSummaryProxy, 'content.fulfilled')) {
                  return 'fulfilled';
                } else {
                  return 'pending';
                }
              } else {
                return 'error';
              }
            } else {
              return 'loading';
            }
          }
        } else {
          return 'error';
        }
      } else {
        return 'loading';
      }
    }
  ),
});
