/**
 * Executes backend operations related to audit logs.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { normalizeEntriesPage } from 'onedata-gui-common/utils/audit-log';

export default Service.extend({
  onedataGraph: service(),

  /**
   * @param {string} auditLogGri
   * @param {AuditLogListingParams} listingParams
   * @param {(content: unknown) => T|null} normalizeEntryContent
   * @returns {Promise<AuditLogEntriesPage<T>>}
   */
  async getAuditLogEntries(auditLogGri, listingParams, normalizeEntryContent) {
    if ((listingParams?.limit || 0) <= 0) {
      return { logEntries: [], isLast: false };
    }

    const result = await this.get('onedataGraph').request({
      gri: auditLogGri,
      operation: 'get',
      data: listingParams,
      subscribe: false,
    });
    return normalizeEntriesPage(result, normalizeEntryContent);
  },
});
