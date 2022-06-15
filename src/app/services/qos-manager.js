/**
 * Backend operations for QoS
 *
 * @module services/qos-manager
 * @author Jakub Liput, Michał Borzęcki
 * @copyright (C) 2020-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { entityType as qosEntityType } from 'oneprovider-gui/models/qos-requirement';
import { get } from '@ember/object';
import { entityType as qosRequirementEntityType } from 'oneprovider-gui/models/qos-requirement';

/**
 * @typedef {Object} QosEntryTimeSeriesCollections
 * @param {Array<string>} bytes
 * @param {Array<string>} files
 */

/**
 * @type {'synchronization started'|'synchronization skipped'|'synchronization failed'|'synchronized'} QosLogStatus
 */

/**
 * @type {'file deleted'|'file already replicated'} QosLogNotDoneReason
 */

/**
 * @type {'info'|'error'} QosLogSeverity
 */

/**
 * @type {QosLogNotDoneReason|Object} QosLogReason
 */

/**
 * @typedef {Object} QosLogData
 * @param {QosLogStatus} status
 * @param {QosLogSeverity} severity
 * @param {string} fileId CDMI Object ID of the file that the event is about
 * @param {QosLogReason} [reason] only if status is skipped or failed
 */

/**
 * @typedef {JsonInfiniteLogEntry<QosLogData>} QosLogEntry
 */

const auditLogAspect = 'audit_log';

export const QosLogStatusEnum = Object.freeze({
  started: 'synchronization started',
  skipped: 'synchronization skipped',
  failed: 'synchronization failed',
  done: 'synchronized',
});

export const QosNotDoneReasonEnum = Object.freeze({
  deleted: 'file deleted',
  alreadyReplicated: 'file already replicated',
});

/**
 * @param {string} qosId
 * @param {{ aspect: string?, scope: string? }} griOptions
 * @returns {string}
 */
export function getGri(qosId, { aspect = 'instance', scope = 'private' } = {}) {
  return gri({
    entityType: qosEntityType,
    entityId: qosId,
    aspect,
    scope,
  });
}

export default Service.extend({
  store: service(),
  onedataGraph: service(),
  timeSeriesManager: service(),
  infiniteLogManager: service(),

  async getRecord(qosGri, reload = false) {
    const cachedRecord = reload ?
      null : this.get('store').peekRecord('qosRequirement', qosGri);
    if (!cachedRecord) {
      return await this.get('store').findRecord('qosRequirement', qosGri);
    } else {
      return cachedRecord;
    }
  },

  getRecordById(entityId, scope = 'private') {
    return this.getRecord(getGri(entityId, { scope }));
  },

  createQosRequirement(file, expression, replicasNum) {
    return this.get('store').createRecord('qosRequirement', {
      replicasNum,
      _meta: {
        additionalData: {
          fileId: get(file, 'cdmiObjectId'),
          expression,
        },
      },
    }).save();
  },

  removeQosRequirement(qosRequirement) {
    return qosRequirement.destroyRecord();
  },

  /**
   * @param {string} qosRequirementId
   * @param {'bytes'|'files'} timeSeriesCollectionId
   * @param {TimeSeriesMetricsQueryParams} queryParams
   * @returns {Promise<TimeSeriesMetricsQueryResult>}
   */
  async queryTimeSeriesMetrics(
    qosRequirementId,
    timeSeriesCollectionId,
    queryParams
  ) {
    const gri = getGri(qosRequirementId, {
      aspect: `time_series_collection,${timeSeriesCollectionId}`,
    });
    return this.get('timeSeriesManager')
      .queryTimeSeriesMetrics(gri, queryParams);
  },

  /**
   * @param {string} qosRequirementId
   * @returns {Promise<QosEntryTimeSeriesCollections>}
   */
  async getTimeSeriesCollections(qosRequirementId) {
    const gri = getGri(qosRequirementId, {
      aspect: 'time_series_collections',
    });
    return this.get('onedataGraph').request({
      gri,
      operation: 'get',
      subscribe: false,
    });
  },

  /**
   * @param {string} qosRequirementId
   * @param {JsonInfiniteLogPagingParams} pagingParams
   * @returns {Promise<JsonInfiniteLogPage<QosLogData>>}
   */
  async getAuditLog(qosRequirementId, pagingParams) {
    const infiniteLogManager = this.get('infiniteLogManager');
    const requestGri = gri({
      entityType: qosRequirementEntityType,
      entityId: qosRequirementId,
      aspect: auditLogAspect,
    });
    return await infiniteLogManager.getJsonInfiniteLogContent(requestGri, pagingParams);
  },
});
