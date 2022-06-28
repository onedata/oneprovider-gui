/**
 * Executes backend operations related to infinite logs.
 *
 * @module services/infinite-log-manager
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';

/**
 * @typedef {Object} JsonInfiniteLogPagingParams
 * @property {string|null} index
 * @property {number} limit
 * @property {number} offset
 * @property {'backward_from_newest'|'forward_from_oldest'} [direction] if there flag is
 *   not present, backend uses "backward_from_newest" by default
 */

/**
 * @typedef {Object} JsonInfiniteLogPage<T>
 * @property {Array<JsonInfiniteLogEntry<T>>} array
 * @property {boolean} isLast
 */

/**
 * @typedef {Object} JsonInfiniteLogEntry<T>
 * @property {string} index
 * @property {number} timestamp milliseconds from Epoch
 * @property {T} content
 */

/**
 * Supported severity types of infinite log entries used in frontend.
 * Adds some computed types that improves UX in addition to backend severity types.
 * @typedef {'debug'|'info'|'notice'|'warning'|'alert'|'error'|'critical'|'emergency'|'success'} FrontendInfiniteLogSeverity
 */

export default Service.extend({
  onedataGraph: service(),

  /**
   * @param {string} jsonInfiniteLogGri
   * @param {JsonInfiniteLogPagingParams} pagingParams
   * @returns {Promise<JsonInfiniteLogPage>}
   */
  async getJsonInfiniteLogContent(jsonInfiniteLogGri, pagingParams) {
    if (!pagingParams || !pagingParams.limit || pagingParams.limit <= 0) {
      return { array: [], isLast: false };
    }

    const onedataGraph = this.get('onedataGraph');
    const { logEntries, isLast } = await onedataGraph.request({
      gri: jsonInfiniteLogGri,
      operation: 'get',
      data: pagingParams,
      subscribe: false,
    });

    return { array: logEntries, isLast };
  },
});
