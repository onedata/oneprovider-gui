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
import { promise } from 'ember-awesome-macros';
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

const storageTsNamePrefix = 'st_';

export default Component.extend(I18n, createDataProxyMixin('tsCollections'), {
  classNames: ['qos-entry-charts', 'qos-entry-info-block'],

  i18n: service(),
  onedataConnection: service(),
  qosManager: service(),
  providerManager: service(),
  spaceManager: service(),
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
   * @type {ComputedProperty<PromiseObject<{ current: Model.Provider, all: Array<Model.Provider>}>>}
   */
  spaceProvidersProxy: promise.object(computed(
    'spaceId',
    async function spaceProvidersProxy() {
      const {
        spaceId,
        spaceManager,
        providerManager,
      } = this.getProperties('spaceId', 'spaceManager', 'providerManager');

      const space = await spaceManager.getSpace(spaceId);
      const providerList = (await get(await get(space, 'providerList'), 'list')).toArray();

      const currentProviderId = providerManager.getCurrentProviderId();
      const currentProvider = providerList.findBy('entityId', currentProviderId);
      if (!currentProvider) {
        throw { id: 'notFound' };
      }

      return {
        current: currentProvider,
        all: providerList,
      };
    }
  )),

  /**
   * @type {ComputedProperty<string>}
   */
  currentProviderName: reads('spaceProvidersProxy.content.current.name'),

  /**
   * @type {ComputedProperty<number>}
   */
  spaceProvidersCount: reads('spaceProvidersProxy.content.all.length'),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  headerTooltip: computed(
    'currentProviderName',
    'spaceProvidersCount',
    function headerTooltip() {
      const {
        currentProviderName,
        spaceProvidersCount,
      } = this.getProperties('currentProviderName', 'spaceProvidersCount');

      const translationKey = 'headerTooltip.' +
        (spaceProvidersCount > 1 ? 'manyProviders' : 'singleProvider');
      return this.t(translationKey, { currentProviderName });
    }
  ),

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
    'currentProviderName',
    function inboundChartConfig() {
      const {
        timeResolutionSpecs,
        globalTimeSecondsOffset,
        currentProviderName,
      } = this.getProperties(
        'timeResolutionSpecs',
        'globalTimeSecondsOffset',
        'currentProviderName'
      );
      const config = new OTSCConfiguration({
        nowTimestampOffset: globalTimeSecondsOffset || 0,
        chartDefinition: {
          title: {
            content: this.t('titles.inbound.content'),
            tip: this.t('titles.inbound.tip', { currentProviderName }),
          },
          yAxes: [{
            id: 'bytesAxis',
            name: String(this.t('axes.bytes')),
            minInterval: 1,
            unitName: 'bytes',
          }, {
            id: 'filesAxis',
            name: String(this.t('axes.files')),
            minInterval: 1,
          }],
          seriesGroupBuilders: [{
            builderType: 'static',
            builderRecipe: {
              seriesGroupTemplate: {
                id: 'transferredFiles',
                stacked: true,
              },
            },
          }],
          seriesBuilders: [{
            builderType: 'static',
            builderRecipe: {
              seriesTemplate: {
                id: 'totalBytes',
                name: String(this.t('series.totalBytes')),
                color: '#4A6089',
                type: 'line',
                yAxisId: 'bytesAxis',
                dataProvider: {
                  functionName: 'loadSeries',
                  functionArguments: {
                    sourceType: 'external',
                    sourceSpecProvider: {
                      functionName: 'literal',
                      functionArguments: {
                        data: {
                          externalSourceName: 'qosEntryData',
                          externalSourceParameters: {
                            collectionId: 'bytes',
                            seriesId: 'total',
                          },
                        },
                      },
                    },
                    replaceEmptyParametersProvider: {
                      functionName: 'literal',
                      functionArguments: {
                        data: {
                          strategyProvider: {
                            functionName: 'literal',
                            functionArguments: {
                              data: 'useFallback',
                            },
                          },
                          fallbackValueProvider: {
                            functionName: 'literal',
                            functionArguments: {
                              data: 0,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          }, {
            builderType: 'dynamic',
            builderRecipe: {
              dynamicSeriesConfigsSource: {
                sourceType: 'external',
                sourceSpec: {
                  externalSourceName: 'qosEntryData',
                  externalSourceParameters: {
                    collectionId: 'files',
                  },
                },
              },
              seriesTemplate: {
                idProvider: {
                  functionName: 'getDynamicSeriesConfig',
                  functionArguments: {
                    propertyName: 'id',
                  },
                },
                nameProvider: {
                  functionName: 'getDynamicSeriesConfig',
                  functionArguments: {
                    propertyName: 'name',
                  },
                },
                colorProvider: {
                  functionName: 'getDynamicSeriesConfig',
                  functionArguments: {
                    propertyName: 'color',
                  },
                },
                typeProvider: {
                  functionName: 'literal',
                  functionArguments: {
                    data: 'bar',
                  },
                },
                yAxisIdProvider: {
                  functionName: 'literal',
                  functionArguments: {
                    data: 'filesAxis',
                  },
                },
                groupIdProvider: {
                  functionName: 'literal',
                  functionArguments: {
                    data: 'transferredFiles',
                  },
                },
                dataProvider: {
                  functionName: 'loadSeries',
                  functionArguments: {
                    sourceType: 'external',
                    sourceSpecProvider: {
                      functionName: 'getDynamicSeriesConfig',
                      functionArguments: {
                        propertyName: 'pointsSource',
                      },
                    },
                    replaceEmptyParametersProvider: {
                      functionName: 'literal',
                      functionArguments: {
                        data: {
                          strategyProvider: {
                            functionName: 'literal',
                            functionArguments: {
                              data: 'useFallback',
                            },
                          },
                          fallbackValueProvider: {
                            functionName: 'literal',
                            functionArguments: {
                              data: 0,
                            },
                          },
                        },
                      },
                    },
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
    'currentProviderName',
    function outboundChartConfig() {
      const {
        timeResolutionSpecs,
        globalTimeSecondsOffset,
        currentProviderName,
      } = this.getProperties(
        'timeResolutionSpecs',
        'globalTimeSecondsOffset',
        'currentProviderName'
      );
      const config = new OTSCConfiguration({
        nowTimestampOffset: globalTimeSecondsOffset || 0,
        chartDefinition: {
          title: {
            content: String(this.t('titles.outbound.content')),
            tip: this.t('titles.outbound.tip', { currentProviderName }),
          },
          yAxes: [{
            id: 'bytesAxis',
            name: String(this.t('axes.bytes')),
            minInterval: 1,
            unitName: 'bytes',
          }],
          seriesGroupBuilders: [{
            builderType: 'static',
            builderRecipe: {
              seriesGroupTemplate: {
                id: 'sentBytes',
                stacked: true,
              },
            },
          }],
          seriesBuilders: [{
            builderType: 'dynamic',
            builderRecipe: {
              dynamicSeriesConfigsSource: {
                sourceType: 'external',
                sourceSpec: {
                  externalSourceName: 'qosEntryData',
                  externalSourceParameters: {
                    collectionId: 'bytes',
                  },
                },
              },
              seriesTemplate: {
                idProvider: {
                  functionName: 'getDynamicSeriesConfig',
                  functionArguments: {
                    propertyName: 'id',
                  },
                },
                nameProvider: {
                  functionName: 'getDynamicSeriesConfig',
                  functionArguments: {
                    propertyName: 'name',
                  },
                },
                colorProvider: {
                  functionName: 'getDynamicSeriesConfig',
                  functionArguments: {
                    propertyName: 'color',
                  },
                },
                typeProvider: {
                  functionName: 'literal',
                  functionArguments: {
                    data: 'line',
                  },
                },
                yAxisIdProvider: {
                  functionName: 'literal',
                  functionArguments: {
                    data: 'bytesAxis',
                  },
                },
                groupIdProvider: {
                  functionName: 'literal',
                  functionArguments: {
                    data: 'sentBytes',
                  },
                },
                dataProvider: {
                  functionName: 'loadSeries',
                  functionArguments: {
                    sourceType: 'external',
                    sourceSpecProvider: {
                      functionName: 'getDynamicSeriesConfig',
                      functionArguments: {
                        propertyName: 'pointsSource',
                      },
                    },
                    replaceEmptyParametersProvider: {
                      functionName: 'literal',
                      functionArguments: {
                        data: {
                          strategyProvider: {
                            functionName: 'literal',
                            functionArguments: {
                              data: 'useFallback',
                            },
                          },
                          fallbackValueProvider: {
                            functionName: 'literal',
                            functionArguments: {
                              data: 0,
                            },
                          },
                        },
                      },
                    },
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
   * @returns {Promise<Array<OTSCRawSeriesPoint>>}
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
      .map(({ seriesId, storageId, name }) => ({
        id: storageId,
        name,
        color: colorGenerator.generateColorForKey(storageId),
        pointsSource: {
          externalSourceName: 'qosEntryData',
          externalSourceParameters: {
            collectionId: sourceParameters.collectionId,
            seriesId,
          },
        },
      }));
  },

  /**
   * @param {'bytes'|'files'} collectionId
   * @returns {Promise<Array<{ seriesId, storageId, name }>>}
   */
  async fetchStorageSeriesConfigs(collectionId) {
    const {
      spaceId,
      storageManager,
      providerManager,
    } = this.getProperties(
      'spaceId',
      'storageManager',
      'providerManager',
    );

    const collectionSeries = (await this.getTsCollections())[collectionId];
    const storagesIds = collectionSeries
      ?.map((seriesName) => {
        if (seriesName.startsWith(storageTsNamePrefix)) {
          return seriesName.slice(storageTsNamePrefix.length);
        } else {
          return null;
        }
      })
      ?.filter(Boolean) ?? [];

    const seriesPromises = [];
    for (let i = 0; i < storagesIds.length; i++) {
      const storageId = storagesIds[i];
      seriesPromises.push((async () => {
        const seriesEntry = {
          seriesId: `${storageTsNamePrefix}${storageId}`,
          storageId,
        };
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
    return seriesEntries.sortBy('sortKey').map(({ seriesId, storageId, name }) =>
      ({ seriesId, storageId, name })
    );
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
