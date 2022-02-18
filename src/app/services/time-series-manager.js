/**
 * Executes backend operations related to time series.
 *
 * @module services/time-series-manager
 * @author Michał Borzęcki
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';

/**
 * @typedef {Object} TimeSeriesMetricsQueryParams
 * @property {Object<string,Array<string>>} metrics object with series IDs as keys
 *   and arrays of metrics IDs as values
 * @property {number|null} startTimestamp
 * @property {number} limit
 */

/**
 * @typedef {Object<string,Object<string,Array<{ timestamp: number, value: number}>>} TimeSeriesMetricsQueryResult
 *   is a nested map (seriesId -> (metricId -> array of points))
 */

export default Service.extend({
  onedataGraph: service(),

  /**
   * @param {string} timeSeriesCollectionGri
   * @param {TimeSeriesMetricsQueryParams} queryParams
   * @returns {Promise<TimeSeriesMetricsQueryResult>}
   */
  async queryTimeSeriesMetrics(timeSeriesCollectionGri, queryParams) {
    if (!queryParams) {
      return {};
    }

    const onedataGraph = this.get('onedataGraph');
    const result = await onedataGraph.request({
      gri: timeSeriesCollectionGri,
      operation: 'get',
      data: queryParams,
      subscribe: false,
    });

    return result && result.windows || {};
  },
});
