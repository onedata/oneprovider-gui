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
   * Mapping GRI -> TimeSeriesCollectionSchema
   * @type {Object<string, Promise<TimeSeriesCollectionSchema>>}
   */
  timeSeriesCollectionSchemasCache: undefined,

  /**
   * Mapping GRI -> (invalidation timer and TimeSeriesCollectionLayout)
   * @type {Object<string, {invalidationTimer: unknown, promise: Promise<TimeSeriesCollectionLayout>}>}
   */
  timeSeriesCollectionLayoutsCache: undefined,

  /**
   * Time in seconds after which layout will be removed from cache (invalidated).
   * @type {number}
   */
  timeSeriesCollectionLayoutInvalidationTimeout: 15,

  init() {
    this._super(...arguments);

    this.setProperties({
      timeSeriesCollectionSchemasCache: {},
      timeSeriesCollectionLayoutsCache: {},
    });
  },

  /**
   * @param {string} timeSeriesCollectionSchemaGri
   * @param {{ reload: boolean }} options
   * @returns {Promise<TimeSeriesCollectionSchema>}
   */
  async getTimeSeriesCollectionSchema(
    timeSeriesCollectionSchemaGri, { reload = false } = {}
  ) {
    if (
      timeSeriesCollectionSchemaGri in this.timeSeriesCollectionSchemasCache &&
      !reload
    ) {
      return this.timeSeriesCollectionSchemasCache[timeSeriesCollectionSchemaGri];
    }

    const schemaPromise = this.onedataGraph.request({
      gri: timeSeriesCollectionSchemaGri,
      operation: 'get',
      subscribe: false,
    }).then((schema) => schema ?? { timeSeriesSchemas: [] });

    this.timeSeriesCollectionSchemasCache[timeSeriesCollectionSchemaGri] = schemaPromise;

    return schemaPromise;
  },

  /**
   * @param {string} timeSeriesCollectionGri
   * @param {{ reload: boolean }} options
   * @returns {Promise<TimeSeriesCollectionLayout>}
   */
  async getTimeSeriesCollectionLayout(timeSeriesCollectionGri, { reload = false } = {}) {
    const cachedLayout = this.timeSeriesCollectionLayoutsCache[timeSeriesCollectionGri];

    if (cachedLayout) {
      if (reload) {
        clearTimeout(cachedLayout.invalidationTimer);
      } else {
        return cachedLayout.promise;
      }
    }

    const layoutPromise = this.onedataGraph.request({
      gri: timeSeriesCollectionGri,
      operation: 'get',
      data: {
        mode: 'layout',
      },
      subscribe: false,
    }).then((result) => result?.layout ?? {});

    this.timeSeriesCollectionLayoutsCache[timeSeriesCollectionGri] = {
      invalidationTimer: setTimeout(() => {
        delete this.timeSeriesCollectionLayoutsCache[timeSeriesCollectionGri];
      }, this.timeSeriesCollectionLayoutInvalidationTimeout * 1000),
      promise: layoutPromise,
    };

    return layoutPromise;
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
