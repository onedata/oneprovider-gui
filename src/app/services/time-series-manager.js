/**
 * Executes backend operations related to time series.
 *
 * @module services/time-series-manager
 * @author Michał Borzęcki
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';

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
   * @returns {Promise<TimeSeriesCollectionLayout>}
   */
  async getTimeSeriesCollectionLayout(timeSeriesCollectionGri) {
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
   * @param {TimeSeriesCollectionSliceQueryParams} queryParams
   * @returns {Promise<TimeSeriesCollectionSlice>}
   */
  async getTimeSeriesCollectionSlice(timeSeriesCollectionGri, queryParams) {
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
