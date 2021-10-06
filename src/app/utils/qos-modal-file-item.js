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
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { inject as service } from '@ember/service';

const objectMixins = [
  OwnerInjector,
  createDataProxyMixin('fileQosSummary'),
  createDataProxyMixin('qosItems'),
];

export default EmberObject.extend(...objectMixins, {
  fileManager: service(),

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

  fileQosStatus: computed(
    'qosItemsProxy.content',
    'fileQosSummaryProxy.content',
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
      fileManager,
    } = this.getProperties('file', 'qosItemsCache', 'fileManager');
    const modalFileId = get(file, 'entityId');

    const fileQosSummary = await this.updateFileQosSummaryProxy({ replace: true });
    const qosRequirements = await fileQosSummary.updateQosRecordsProxy({ replace: true });
    const sourceFiles = await allFulfilled(qosRequirements.map(async (requirement) => {
      try {
        return await get(requirement, 'file');
      } catch (error) {
        if (
          error && error.id === 'posix' &&
          error.details && error.details.errno === 'enoent'
        ) {
          return null;
        } else {
          throw error;
        }
      }
    }));

    const requirementsFilesZip = _.zip(qosRequirements, sourceFiles);
    const qosItemsPromises = requirementsFilesZip.map(async ([qos, qosSourceFile]) => {
      const qosId = get(qos, 'entityId');

      const newStatusForFile = get(fileQosSummary, `requirements.${qosId}`);
      if (qosItemsCache.has(qosId)) {
        const qosItem = qosItemsCache.get(qosId);
        if (newStatusForFile !== get(qosItem, 'statusForFile')) {
          set(qosItem, 'statusForFile', newStatusForFile);
        }
        return qosItem;
      } else {
        const qosSourceFileId = qosSourceFile && get(qosSourceFile, 'entityId');
        const qosItem = QosItem.create({
          qos,
          direct: !qosSourceFileId || modalFileId === qosSourceFileId ||
            await fileManager.areFilesHardlinked(modalFileId, qosSourceFileId),
          qosSourceFile,
          statusForFile: newStatusForFile,
          entityId: qosId,
          replicasNum: get(qos, 'replicasNum'),
          expressionRpn: get(qos, 'expressionRpn'),
        });
        qosItemsCache.set(qosId, qosItem);
        return qosItem;
      }
    });
    return allFulfilled(qosItemsPromises);
  },

  /**
   * Updates data that should be displayed - see usages in code.
   * @param {Boolean} [replace] if true, do not change pending state of `qosItemsProxy`
   */
  async updateData(replace = false) {
    await this.updateQosItemsProxy({ replace });
    await this.get('file').reload();
  },

  init() {
    this._super(...arguments);
    this.set('qosItemsCache', new Map());
  },
});
