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
 * @typedef {'scheduled'|'skipped'|'completed'|'failed'} QosLogStatus
 */

/**
 * @typedef {Object} QosLogErrorReason
 */

/**
 * @typedef {Object} QosAuditLogEntryContent
 * @param {QosLogStatus|null} status
 * @param {string|null} fileId CDMI Object ID of the file that the event is about
 * @param {string|null} description a human-readable description of event
 * @param {QosLogErrorReason} [reason] error object - only if status is failed
 */

const auditLogAspect = 'audit_log';

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
  auditLogManager: service(),
  fileManager: service(),

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

  async createQosRequirement(file, expression, replicasNum) {
    try {
      return await this.get('store').createRecord('qosRequirement', {
        replicasNum,
        _meta: {
          additionalData: {
            fileId: get(file, 'cdmiObjectId'),
            expression,
          },
        },
      }).save();
    } finally {
      this.fileManager.refreshRelatedFiles(file);
    }
  },

  async removeQosRequirement(qosRequirement) {
    const filePromise = get(qosRequirement, 'file');
    try {
      return qosRequirement.destroyRecord();
    } finally {
      const file = await filePromise;
      if (file) {
        this.fileManager.refreshRelatedFiles(file);
      }
    }
  },

  /**
   * @param {string} collectionRef
   * @returns {Promise<TimeSeriesCollectionSchema>}
   */
  async getTransferTimeSeriesCollectionSchema(collectionRef) {
    const gri = getGri('null', {
      aspect: `transfer_stats_collection_schema,${collectionRef}`,
      scope: 'public',
    });
    return this.timeSeriesManager.getTimeSeriesCollectionSchema(gri);
  },

  /**
   * @param {string} qosRequirementId
   * @param {string} collectionRef
   * @returns {Promise<TimeSeriesCollectionLayout>}
   */
  async getTransferTimeSeriesCollectionLayout(
    qosRequirementId,
    collectionRef
  ) {
    const gri = getGri(qosRequirementId, {
      aspect: `transfer_stats_collection,${collectionRef}`,
    });
    return this.timeSeriesManager.getTimeSeriesCollectionLayout(gri);
  },

  /**
   * @param {string} qosRequirementId
   * @param {string} collectionRef
   * @param {TimeSeriesCollectionSliceQueryParams} queryParams
   * @returns {Promise<TimeSeriesCollectionSlice>}
   */
  async getTransferTimeSeriesCollectionSlice(
    qosRequirementId,
    collectionRef,
    queryParams
  ) {
    const gri = getGri(qosRequirementId, {
      aspect: `transfer_stats_collection,${collectionRef}`,
    });
    return this.timeSeriesManager.getTimeSeriesCollectionSlice(gri, queryParams);
  },

  /**
   * @param {string} qosRequirementId
   * @param {AuditLogListingParams} listingParams
   * @returns {Promise<AuditLogEntriesPage<QosAuditLogEntryContent>>}
   */
  async getAuditLog(qosRequirementId, listingParams) {
    const requestGri = gri({
      entityType: qosRequirementEntityType,
      entityId: qosRequirementId,
      aspect: auditLogAspect,
    });
    return await this.get('auditLogManager').getAuditLogEntries(
      requestGri,
      listingParams,
      normalizeQosAuditLogEntryContent
    );
  },
});

function isValidQosLogStatus(status) {
  return [
    'scheduled',
    'skipped',
    'completed',
    'failed',
  ].includes(status);
}

/**
 * @param {unknown} content shoold be a `QosAuditLogEntryContent`-like object
 * @returns {QosAuditLogEntryContent}
 */
function normalizeQosAuditLogEntryContent(content) {
  const normalizedContent = content || {};

  if (!isValidQosLogStatus(normalizedContent.status)) {
    normalizedContent.status = null;
  }
  if (typeof normalizedContent.fileId !== 'string') {
    normalizedContent.fileId = null;
  }
  if (typeof normalizedContent.description !== 'string') {
    normalizedContent.description = null;
  }

  return normalizedContent;
}
