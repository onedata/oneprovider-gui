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
import _ from 'lodash';

const objectMixins = [
  createDataProxyMixin('fileQosSummary'),
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
    return this.get('file').getRelation('fileQosSummary', { reload: true });
  },

  /**
   * @override
   */
  async fetchQosItems() {
    const {
      file,
      qosItemsCache,
    } = this.getProperties('file', 'qosItemsCache');
    const modalFileId = get(file, 'entityId');

    const fileQosSummary = await this.updateFileQosSummaryProxy({ replace: true });
    const qosRequirements = await fileQosSummary.updateQosRecordsProxy({ replace: true });
    // const qosRequirements = await fileQosSummary.getQosRecordsProxy();
    const sourceFiles = await allFulfilled(qosRequirements.mapBy('file'));

    return _.zip(qosRequirements, sourceFiles).map(([qos, qosSourceFile]) => {
      const qosId = get(qos, 'entityId');
      if (qosItemsCache.has(qosId)) {
        const qosItem = qosItemsCache.get(qosId);
        // FIXME: every qosItem has the same summary, so compare only one
        if (!qosSummariesEqual(get(qosItem, 'fileQosSummary'), fileQosSummary)) {
          set(qosItem, 'fileQosSummary', fileQosSummary);
        }
        return qosItem;
      } else {
        const qosItem = QosItem.create({
          modalFileId,
          qosSourceFile,
          fileQosSummary,
          qos,
        });
        qosItemsCache.set(qosId, qosItem);
        return qosItem;
      }
    });

    // return this.updateQosRecordsProxy({ replace: true, fetchArgs: [true] })
    //   .then(qosRecords => {
    //     // summary should be fresh after qos records update
    //     const fileQosSummary = this.get('fileQosSummary');
    //     return allFulfilled(qosRecords.map(qos => get(qos, 'file').then(qosSourceFile => {
    //       const qosId = get(qos, 'entityId');
    //       if (qosItemsCache.has(qosId)) {
    //         const qosItem = qosItemsCache.get(qosId);
    //         set(qosItem, 'fileQosSummary', fileQosSummary);
    //         return qosItem;
    //       } else {
    //         const qosItem = QosItem.create({
    //           modalFileId: get(file, 'entityId'),
    //           qosSourceFile,
    //           fileQosSummary,
    //           qos,
    //         });
    //         qosItemsCache.set(qosId, qosItem);
    //         return qosItem;
    //       }
    //     })));
    //   });
  },

  fileQosStatus: computed(
    'qosItemsProxy.{content,reason}',
    'fileQosSummaryProxy.{content,reason}',
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

function qosSummariesEqual(a, b) {
  return get(a, 'status') === get(b, 'status') &&
    _.isEqual(get(a, 'requirements'), get(b, 'requirements'));
}
