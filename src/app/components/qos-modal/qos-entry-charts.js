import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { allSettled } from 'rsvp';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import QueryBatcher from 'onedata-gui-common/utils/one-time-series-chart/query-batcher';
import OTSCConfiguration from 'onedata-gui-common/utils/one-time-series-chart/configuration';
import OTSCModel from 'onedata-gui-common/utils/one-time-series-chart/model';

/**
 * @typedef {Object} QosEntryChartTimeResolution
 * @property {string} metricId
 * @property {number} timeResolution
 * @property {number} windowsCount
 * @property {number} updateInterval
 */

export default Component.extend(I18n, {
  classNames: ['qos-entry-charts'],

  i18n: service(),
  onedataConnection: service(),
  qosManager: service(),
  providerManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.qosModal.qosEntryCharts',

  /**
   * @virtual
   * @type {string}
   */
  qosRequirementId: undefined,

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
      const qosTransferStatsConfig = this.get('qosTransferStatsConfig');
      return [{
        metricId: qosTransferStatsConfig.minuteMetricId,
        timeResolution: 60,
        windowsCount: 60,
        updateInterval: 10,
      }, {
        metricId: qosTransferStatsConfig.hourMetricId,
        timeResolution: 60 * 60,
        windowsCount: 24,
        updateInterval: 30,
      }, {
        metricId: qosTransferStatsConfig.dayMetricId,
        timeResolution: 24 * 60 * 60,
        windowsCount: 30,
        updateInterval: 30,
      }, {
        metricId: qosTransferStatsConfig.monthMetricId,
        timeResolution: 30 * 24 * 60 * 60,
        windowsCount: 12,
        updateInterval: 30,
      }];
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
  savedDataChartConfig: computed(
    'timeResolutionSpecs',
    'globalTimeSecondsOffset',
    function savedDataChartConfig() {
      const {
        timeResolutionSpecs,
        globalTimeSecondsOffset,
      } = this.getProperties('timeResolutionSpecs', 'globalTimeSecondsOffset');
      const config = new OTSCConfiguration({
        nowTimestampOffset: globalTimeSecondsOffset,
        rawConfiguration: {
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
            factoryName: 'static',
            factoryArguments: {
              seriesTemplate: {
                id: 'totalFiles',
                name: String(this.t('series.totalFiles')),
                type: 'bar',
                yAxisId: 'filesAxis',
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
                            collectionId: 'files',
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
          }],
        },
        timeResolutionSpecs,
        externalDataSources: {
          qosEntryData: {
            fetchSeries: (...args) => this.fetchSeriesPoints(...args),
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
  incomingDataChartConfig: computed(
    'timeResolutionSpecs',
    'globalTimeSecondsOffset',
    function incomingDataChartConfig() {
      const {
        timeResolutionSpecs,
        globalTimeSecondsOffset,
      } = this.getProperties('timeResolutionSpecs', 'globalTimeSecondsOffset');
      const config = new OTSCConfiguration({
        nowTimestampOffset: globalTimeSecondsOffset,
        rawConfiguration: {
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
                type: 'line',
                yAxisId: 'bytesAxis',
                stackId: 'receivedBytesStack',
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
            fetchSeries: (...args) => this.fetchSeriesPoints(...args),
            fetchDynamicSeriesConfigs: async ({ collectionId }) => {
              return (await this.fetchProvidersSeries(collectionId))
                .map(({ providerId, providerName }) => ({
                  id: providerId,
                  name: providerName,
                  pointsSource: {
                    externalSourceName: 'qosEntryData',
                    externalSourceParameters: {
                      collectionId: 'bytes',
                      seriesId: providerId,
                    },
                  },
                }));
            },
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
  savedDataChartModel: computed(
    'savedDataChartConfig',
    function savedDataChartModel() {
      return OTSCModel.create({
        configuration: this.get('savedDataChartConfig'),
      });
    }
  ),

  /**
   * @type {ComputedProperty<Utils.OneTimeSeriesChart.Model>}
   */
  incomingDataChartModel: computed(
    'incomingDataChartModel',
    function savedDataChartModel() {
      return OTSCModel.create({
        configuration: this.get('incomingDataChartConfig'),
      });
    }
  ),

  async fetchSeriesPoints(context, externalSourceParameters) {
    const {
      timeResolutionSpecs,
      timeSeriesQueryBatcher,
    } = this.getProperties('timeResolutionSpecs', 'timeSeriesQueryBatcher');
    const matchingTimeResolutionSpec = timeResolutionSpecs
      .findBy('timeResolution', context.timeResolution);
    const metricId = matchingTimeResolutionSpec ?
      matchingTimeResolutionSpec.metricId : null;
    if (!metricId) {
      return [];
    }
    const queryParams = {
      collectionId: externalSourceParameters.collectionId,
      seriesId: externalSourceParameters.seriesId,
      metricId,
      firstTimestamp: context.lastWindowTimestamp,
      limit: context.windowsCount,
    };
    return timeSeriesQueryBatcher.query(queryParams);
  },

  /**
   * @param {'bytes'|'files'} collectionId
   * @returns {Promise<Array<{ providerId, providerName }>>}
   */
  async fetchProvidersSeries(collectionId) {
    const {
      qosManager,
      providerManager,
      qosRequirementId,
      qosTransferStatsConfig,
    } = this.getProperties(
      'qosManager',
      'providerManager',
      'qosRequirementId',
      'qosTransferStatsConfig'
    );

    const collectionSeries =
      (await qosManager.getTimeSeriesCollections(qosRequirementId))[collectionId];
    const providersIds = collectionSeries ?
      collectionSeries.without(qosTransferStatsConfig.totalTimeSeriesId) : [];
    const providers = await allSettled(providersIds.map((providerId) =>
      providerManager.getProviderById(providerId)
    ));
    return providersIds.map((providerId, idx) => {
      const provider = providers[idx].value;
      const providerName = provider ?
        get(provider, 'name') :
        String(this.t('unknownProvider', { id: providerId.slice(0, 6) }));
      return {
        providerId,
        providerName,
      };
    });
  },
});
