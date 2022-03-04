/**
 * Shows charts with QoS transfer statistics.
 *
 * @module components/qos-modal/qos-entry-charts
 * @author Michał Borzęcki
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { all as allFulfilled } from 'rsvp';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import QueryBatcher from 'onedata-gui-common/utils/one-time-series-chart/query-batcher';
import OTSCConfiguration from 'onedata-gui-common/utils/one-time-series-chart/configuration';
import OTSCModel from 'onedata-gui-common/utils/one-time-series-chart/model';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import ColorGenerator from 'onedata-gui-common/utils/color-generator';

/**
 * @typedef {Object} QosEntryChartTimeResolution
 * @property {string} metricId
 * @property {number} timeResolution
 * @property {number} pointsCount
 * @property {number} updateInterval
 */

export default Component.extend(I18n, createDataProxyMixin('tsCollections'), {
  classNames: ['qos-entry-charts'],

  i18n: service(),
  onedataConnection: service(),
  qosManager: service(),
  providerManager: service(),
  storageManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.qosModal.qosEntryCharts',

  /**
   * @virtual
   * @type {string}
   */
  spaceId: undefined,

  /**
   * @virtual
   * @type {string}
   */
  qosRequirementId: undefined,

  /**
   * Timestamp of the last timeSeriesCollections proxy reload
   * @type {number}
   */
  lastTsCollectionsReloadTimestamp: undefined,

  /**
   * @type {ComputedProperty<Utils.ColorGenerator>}
   */
  colorGenerator: computed(() => new ColorGenerator()),

  /**
   * @type {ComputedProperty<QosTransferStatsConfig>}
   */
  qosTransferStatsConfig: reads('onedataConnection.qosTransferStatsConfig'),

  /**
   * @type {ComputedProperty<number>}
   */
  globalTimeSecondsOffset: reads('onedataConnection.globalTimeSecondsOffset'),

  /**
   * @type {Array<QosEntryChartTimeResolution>}
   */
  timeResolutionSpecs: computed(
    'qosTransferStatsConfig',
    function timeResolutionSpecs() {
      const qosTransferStatsConfig = this.get('qosTransferStatsConfig') || {};
      return [{
        metricId: qosTransferStatsConfig.minuteMetricId,
        timeResolution: 60,
        pointsCount: 30,
        updateInterval: 10,
      }, {
        metricId: qosTransferStatsConfig.hourMetricId,
        timeResolution: 60 * 60,
        pointsCount: 24,
        updateInterval: 30,
      }, {
        metricId: qosTransferStatsConfig.dayMetricId,
        timeResolution: 24 * 60 * 60,
        pointsCount: 30,
        updateInterval: 30,
      }, {
        metricId: qosTransferStatsConfig.monthMetricId,
        timeResolution: 30 * 24 * 60 * 60,
        pointsCount: 12,
        updateInterval: 30,
      }].filterBy('metricId');
    }
  ),

  /**
   * @type {ComputedProperty<Utils.OneTimeSeriesChart.QueryBatcher>}
   */
  timeSeriesQueryBatcher: computed(
    'qosRequirementId',
    function timeSeriesQueryBatcher() {
      const {
        qosManager,
        qosRequirementId,
      } = this.getProperties('qosManager', 'qosRequirementId');

      return new QueryBatcher({
        fetchData: (batchedQuery) =>
          qosManager.queryTimeSeriesMetrics(
            qosRequirementId,
            batchedQuery.collectionId, {
              metrics: batchedQuery.metrics,
              startTimestamp: batchedQuery.startTimestamp,
              limit: batchedQuery.limit,
            }
          ),
      });
    }
  ),

  /**
   * @type {ComputedProperty<Utils.OneTimeSeriesChart.Configuration>}
   */
  inboundChartConfig: computed(
    'timeResolutionSpecs',
    'globalTimeSecondsOffset',
    function inboundChartConfig() {
      const {
        timeResolutionSpecs,
        globalTimeSecondsOffset,
      } = this.getProperties('timeResolutionSpecs', 'globalTimeSecondsOffset');
      const config = new OTSCConfiguration({
        nowTimestampOffset: globalTimeSecondsOffset || 0,
        chartDefinition: {
          title: String(this.t('titles.inbound')),
          yAxes: [{
            id: 'bytesAxis',
            name: String(this.t('axes.bytes')),
            minInterval: 1,
            valueFormatter: {
              functionName: 'asBytes',
              functionArguments: {
                data: {
                  functionName: 'supplyValue',
                },
              },
            },
          }, {
            id: 'filesAxis',
            name: String(this.t('axes.files')),
            minInterval: 1,
          }],
          series: [{
            factoryName: 'static',
            factoryArguments: {
              seriesTemplate: {
                id: 'totalBytes',
                name: String(this.t('series.totalBytes')),
                color: '#4A6089',
                type: 'line',
                yAxisId: 'bytesAxis',
                data: {
                  functionName: 'replaceEmpty',
                  functionArguments: {
                    data: {
                      functionName: 'loadSeries',
                      functionArguments: {
                        sourceType: 'external',
                        sourceParameters: {
                          externalSourceName: 'qosEntryData',
                          externalSourceParameters: {
                            collectionId: 'bytes',
                            seriesId: 'total',
                          },
                        },
                      },
                    },
                    fallbackValue: 0,
                  },
                },
              },
            },
          }, {
            factoryName: 'dynamic',
            factoryArguments: {
              dynamicSeriesConfigs: {
                sourceType: 'external',
                sourceParameters: {
                  externalSourceName: 'qosEntryData',
                  externalSourceParameters: {
                    collectionId: 'files',
                  },
                },
              },
              seriesTemplate: {
                id: {
                  functionName: 'getDynamicSeriesConfigData',
                  functionArguments: {
                    propertyName: 'id',
                  },
                },
                name: {
                  functionName: 'getDynamicSeriesConfigData',
                  functionArguments: {
                    propertyName: 'name',
                  },
                },
                color: {
                  functionName: 'getDynamicSeriesConfigData',
                  functionArguments: {
                    propertyName: 'color',
                  },
                },
                type: 'bar',
                yAxisId: 'filesAxis',
                stackId: 'filesStack',
                data: {
                  functionName: 'replaceEmpty',
                  functionArguments: {
                    data: {
                      functionName: 'loadSeries',
                      functionArguments: {
                        sourceType: 'external',
                        sourceParameters: {
                          functionName: 'getDynamicSeriesConfigData',
                          functionArguments: {
                            propertyName: 'pointsSource',
                          },
                        },
                      },
                    },
                    fallbackValue: 0,
                  },
                },
              },
            },
          }],
        },
        timeResolutionSpecs,
        externalDataSources: {
          qosEntryData: {
            fetchSeries: (...args) => this.fetchSeries(...args),
            fetchDynamicSeriesConfigs: (...args) =>
              this.fetchDynamicSeriesConfigs(...args),
          },
        },
      });
      config.setViewParameters({ live: true });
      return config;
    }
  ),

  /**
   * @type {ComputedProperty<Utils.OneTimeSeriesChart.Configuration>}
   */
  outboundChartConfig: computed(
    'timeResolutionSpecs',
    'globalTimeSecondsOffset',
    function outboundChartConfig() {
      const {
        timeResolutionSpecs,
        globalTimeSecondsOffset,
      } = this.getProperties('timeResolutionSpecs', 'globalTimeSecondsOffset');
      const config = new OTSCConfiguration({
        nowTimestampOffset: globalTimeSecondsOffset || 0,
        chartDefinition: {
          title: String(this.t('titles.outbound')),
          yAxes: [{
            id: 'bytesAxis',
            name: String(this.t('axes.bytes')),
            minInterval: 1,
            valueFormatter: {
              functionName: 'asBytes',
              functionArguments: {
                data: {
                  functionName: 'supplyValue',
                },
              },
            },
          }],
          series: [{
            factoryName: 'dynamic',
            factoryArguments: {
              dynamicSeriesConfigs: {
                sourceType: 'external',
                sourceParameters: {
                  externalSourceName: 'qosEntryData',
                  externalSourceParameters: {
                    collectionId: 'bytes',
                  },
                },
              },
              seriesTemplate: {
                id: {
                  functionName: 'getDynamicSeriesConfigData',
                  functionArguments: {
                    propertyName: 'id',
                  },
                },
                name: {
                  functionName: 'getDynamicSeriesConfigData',
                  functionArguments: {
                    propertyName: 'name',
                  },
                },
                color: {
                  functionName: 'getDynamicSeriesConfigData',
                  functionArguments: {
                    propertyName: 'color',
                  },
                },
                type: 'line',
                yAxisId: 'bytesAxis',
                stackId: 'bytesStack',
                data: {
                  functionName: 'replaceEmpty',
                  functionArguments: {
                    data: {
                      functionName: 'loadSeries',
                      functionArguments: {
                        sourceType: 'external',
                        sourceParameters: {
                          functionName: 'getDynamicSeriesConfigData',
                          functionArguments: {
                            propertyName: 'pointsSource',
                          },
                        },
                      },
                    },
                    fallbackValue: 0,
                  },
                },
              },
            },
          }],
        },
        timeResolutionSpecs,
        externalDataSources: {
          qosEntryData: {
            fetchSeries: (...args) => this.fetchSeries(...args),
            fetchDynamicSeriesConfigs: (...args) =>
              this.fetchDynamicSeriesConfigs(...args),
          },
        },
      });
      config.setViewParameters({ live: true });
      return config;
    }
  ),

  /**
   * @type {ComputedProperty<Utils.OneTimeSeriesChart.Model>}
   */
  inboundChartModel: computed(
    'inboundChartConfig',
    function inboundChartModel() {
      return OTSCModel.create({
        configuration: this.get('inboundChartConfig'),
      });
    }
  ),

  /**
   * @type {ComputedProperty<Utils.OneTimeSeriesChart.Model>}
   */
  outboundChartModel: computed(
    'outboundChartModel',
    function outboundChartModel() {
      return OTSCModel.create({
        configuration: this.get('outboundChartConfig'),
      });
    }
  ),

  /**
   * @override
   */
  willDestroyElement() {
    try {
      const {
        inboundChartModel,
        outboundChartModel,
      } = this.getProperties('inboundChartModel', 'outboundChartModel');
      inboundChartModel.destroy();
      outboundChartModel.destroy();
    } finally {
      this._super(...arguments);
    }
  },

  /**
   * @param {OTSCDataSourceFetchParams} seriesParameters
   * @param {{ collectionId: string, seriesId: string }} sourceParameters
   * @returns {Promise<Array<RawOTSCSeriesPoint>>}
   */
  async fetchSeries(seriesParameters, sourceParameters) {
    const {
      timeResolutionSpecs,
      timeSeriesQueryBatcher,
    } = this.getProperties('timeResolutionSpecs', 'timeSeriesQueryBatcher');
    const matchingTimeResolutionSpec = timeResolutionSpecs
      .findBy('timeResolution', seriesParameters.timeResolution);
    const metricId = matchingTimeResolutionSpec ?
      matchingTimeResolutionSpec.metricId : null;
    if (!metricId) {
      return [];
    }
    const queryParams = {
      collectionId: sourceParameters.collectionId,
      seriesId: sourceParameters.seriesId,
      metricId,
      startTimestamp: seriesParameters.lastPointTimestamp,
      limit: seriesParameters.pointsCount,
    };
    return timeSeriesQueryBatcher.query(queryParams);
  },

  /**
   * @param {{ collectionId: string }} sourceParameters
   * @returns {Promise<Array<{ id: string, name: string, color: string, pointsSource: OTSCExternalDataSourceRefParameters }>>}
   */
  async fetchDynamicSeriesConfigs(sourceParameters) {
    const colorGenerator = this.get('colorGenerator');
    return (await this.fetchStorageSeriesConfigs(sourceParameters.collectionId))
      .map(({ storageId, name }) => ({
        id: storageId,
        name,
        color: colorGenerator.generateColorForKey(storageId),
        pointsSource: {
          externalSourceName: 'qosEntryData',
          externalSourceParameters: {
            collectionId: sourceParameters.collectionId,
            seriesId: storageId,
          },
        },
      }));
  },

  /**
   * @param {'bytes'|'files'} collectionId
   * @returns {Promise<Array<{ storageId, name }>>}
   */
  async fetchStorageSeriesConfigs(collectionId) {
    const {
      spaceId,
      storageManager,
      providerManager,
      qosTransferStatsConfig = {},
    } = this.getProperties(
      'spaceId',
      'storageManager',
      'providerManager',
      'qosTransferStatsConfig'
    );

    const collectionSeries = (await this.getTsCollections())[collectionId];
    const storagesIds = collectionSeries ?
      collectionSeries.without(qosTransferStatsConfig.totalTimeSeriesId) : [];

    const seriesPromises = [];
    for (let i = 0; i < storagesIds.length; i++) {
      const storageId = storagesIds[i];
      seriesPromises.push((async () => {
        const seriesEntry = { storageId };
        try {
          const storage = await storageManager.getStorageById(storageId, {
            throughSpaceId: spaceId,
            backgroundReload: false,
          });
          seriesEntry.storageName = get(storage, 'name');
          seriesEntry.providerId = storage.relationEntityId('provider');
        } catch (error) {
          console.error(
            `component:qos-modal/qos-entry-charts#fetchStorageSeriesConfigs: cannot load storage with ID "${storageId}"`,
            error
          );
          seriesEntry.providerId = null;
        }
        const providerId = seriesEntry.providerId;
        if (providerId) {
          try {
            const provider = await providerManager.getProviderById(providerId, {
              throughSpaceId: spaceId,
              backgroundReload: false,
            });
            seriesEntry.providerName = get(provider, 'name');
          } catch (error) {
            console.error(
              `component:qos-modal/qos-entry-charts#fetchStorageSeriesConfigs: cannot load provider with ID "${providerId}"`,
              error
            );
          }
        }
        let name = seriesEntry.storageName || String(this.t('unknownStorage', {
          id: storageId.slice(0, 6),
        }));
        if (seriesEntry.storageName) {
          name += ' ‐ ';
          name += seriesEntry.providerName || String(this.t('unknownProvider', {
            id: providerId.slice(0, 6),
          }));
        }
        seriesEntry.name = name;
        const providerSortKey =
          `${Number(!seriesEntry.providerName)}${seriesEntry.providerName || providerId}`;
        const storageSortKey =
          `${Number(!seriesEntry.storageName)}${seriesEntry.storageName || storageId}`;
        seriesEntry.sortKey = `${providerSortKey}\n${storageSortKey}`;
        return seriesEntry;
      })());
    }

    const seriesEntries = await allFulfilled(seriesPromises);
    return seriesEntries.sortBy('sortKey').map(({ storageId, name }) => ({ storageId, name }));
  },

  /**
   * @override
   */
  async fetchTsCollections() {
    const {
      qosManager,
      qosRequirementId,
    } = this.getProperties(
      'qosManager',
      'qosRequirementId',
    );
    return qosManager.getTimeSeriesCollections(qosRequirementId);
  },

  /**
   * @returns {Promise<QosEntryTimeSeriesCollections>}
   */
  async getTsCollections() {
    const lastTsCollectionsReloadTimestamp =
      this.get('lastTsCollectionsReloadTimestamp');
    const nowTimestamp = Math.floor(Date.now() / 1000);
    if (
      !lastTsCollectionsReloadTimestamp ||
      nowTimestamp - lastTsCollectionsReloadTimestamp > 10
    ) {
      this.set('lastTsCollectionsReloadTimestamp', nowTimestamp);
      return this.updateTsCollectionsProxy();
    } else {
      return this.getTsCollectionsProxy();
    }
  },
});
