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
 * @typedef {Object} TimeSeriesCollectionSchema
 * @property {Array<AtmTimeSeriesSchema>} timeSeriesSchemas
 */

/**
 * @typedef {Object} TimeSeriesSliceQueryParams
 * @property {Object<string,Array<string>>} layout object with series names as keys
 *   and arrays of metrics names as values
 * @property {number|null} startTimestamp
 * @property {number} windowLimit
 */

/**
 * @typedef {Object<string,Object<string,Array<{ timestamp: number, value: number }>>} TimeSeriesSlice
 *   is a nested map (seriesName -> (metricName -> array of points))
 */

/**
 * @typedef {Object<string, Array<string>} TimeSeriesLayout
 *   is a map (seriesName -> (array of metric names))
 */

export default Service.extend({
  onedataGraph: service(),

  /**
   * @param {string} timeSeriesCollectionSchemaGri
   * @returns {Promise<TimeSeriesCollectionSchema>}
   */
  async getTimeSeriesCollectionSchema(timeSeriesCollectionSchemaGri) {
    const result = await this.onedataGraph.request({
      gri: timeSeriesCollectionSchemaGri,
      operation: 'get',
      subscribe: false,
    });

    return result ?? { timeSeriesSchemas: [] };
  },

  /**
   * @param {string} timeSeriesCollectionGri
   * @returns {Promise<TimeSeriesLayout>}
   */
  async getTimeSeriesLayout(timeSeriesCollectionGri) {
    const result = await this.onedataGraph.request({
      gri: timeSeriesCollectionGri,
      operation: 'get',
      data: {
        mode: 'layout',
      },
      subscribe: false,
    });

    return result?.layout || {};
  },

  /**
   * @param {string} timeSeriesCollectionGri
   * @param {TimeSeriesSliceQueryParams} queryParams
   * @returns {Promise<TimeSeriesSlice>}
   */
  async queryTimeSeriesSlice(timeSeriesCollectionGri, queryParams) {
    if (!queryParams) {
      return {};
    }

    const result = await this.onedataGraph.request({
      gri: timeSeriesCollectionGri,
      operation: 'get',
      data: {
        mode: 'slice',
        ...queryParams,
      },
      subscribe: false,
    });

    return result?.slice ?? {};
  },
});
