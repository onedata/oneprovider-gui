/**
 * Executes backend operations related to audit logs.
 *
 * @module services/audit-log-manager
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import gri from 'onedata-gui-websocket-client/utils/gri';

/**
 * @typedef {Object} JsonAuditLogEntry
 * @property {number} timestamp
 * @property {any} payload
 */

export const jsonInfiniteLogEntityType = 'json_infinite_log';

export default Service.extend({
  onedataGraph: service(),

  /**
   * @param {string} jsonAuditLogId
   * @param {string} startFromIndex
   * @param {number} limit
   * @param {number} offset
   * @returns {Promise<{array: Array<JsonAuditLogEntry>, isLast: boolean}>}
   */
  async getJsonAuditLogContent(jsonAuditLogId, startFromIndex, limit, offset) {
    if (!limit || limit <= 0) {
      return { array: [], isLast: false };
    }

    const onedataGraph = this.get('onedataGraph');
    const auditLogContentGri = gri({
      entityType: jsonInfiniteLogEntityType,
      entityId: jsonAuditLogId,
      aspect: 'content',
    });
    const { list, isLast } = await onedataGraph.request({
      gri: auditLogContentGri,
      operation: 'get',
      data: {
        index: startFromIndex,
        offset,
        limit,
      },
      subscribe: false,
    });

    return { array: list, isLast };
  },
});
