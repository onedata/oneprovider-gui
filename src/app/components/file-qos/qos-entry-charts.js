/**
 * Shows charts with QoS transfer statistics.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { all as allFulfilled, hash as hashFulfilled } from 'rsvp';
import { promise } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/i18n';
import ColorGenerator from 'onedata-gui-common/utils/color-generator';
import { getTimeSeriesMetricNamesWithAggregator } from 'onedata-gui-common/utils/time-series';

const perStorageTimeSeriesNameGenerator = 'st_';
const totalTimeSeriesNameGenerator = 'total';

export default Component.extend(I18n, {
  classNames: ['qos-entry-charts'],

  i18n: service(),
  onedataConnection: service(),
  qosManager: service(),
  providerManager: service(),
  spaceManager: service(),
  storageManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileQos.qosEntryCharts',

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
   * @type {ComputedProperty<Utils.ColorGenerator>}
   */
  colorGenerator: computed(() => new ColorGenerator()),

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
   * @type {ComputedProperty<PromiseObject<Object<QosTimeSeriesCollectionRef, TimeSeriesCollectionSchema>>>}
   */
  timeSeriesCollectionSchemasProxy: promise.object(computed(
    function timeSeriesCollectionSchemasProxy() {
      return hashFulfilled({
        bytes: this.qosManager.getQosTransferTimeSeriesCollectionSchema('bytes'),
        files: this.qosManager.getQosTransferTimeSeriesCollectionSchema('files'),
      });
    }
  )),

  /**
   * @type {ComputedProperty<PromiseObject>}
   */
  loadingProxy: promise.object(promise.all(
    'timeSeriesCollectionSchemasProxy',
    'spaceProvidersProxy'
  )),

  /**
   * Mapping QosTimeSeriesCollectionRef -> time series name generator -> metric names.
   * @type {ComputedProperty<Object<QosTimeSeriesCollectionRef,Object<string, Array<string>>>>}
   */
  metricNamesForTimeSeries: computed(
    'timeSeriesCollectionSchemasProxy.content',
    function metricNamesForStorageTimeSeries() {
      const timeSeriesCollectionSchemas = this.timeSeriesCollectionSchemasProxy.content;
      const metrics = {
        bytes: {
          [totalTimeSeriesNameGenerator]: this.extractMetricNamesForTimeSeries(
            timeSeriesCollectionSchemas?.bytes,
            totalTimeSeriesNameGenerator,
            'sum'
          ),
          [perStorageTimeSeriesNameGenerator]: this.extractMetricNamesForTimeSeries(
            timeSeriesCollectionSchemas?.bytes,
            perStorageTimeSeriesNameGenerator,
            'sum'
          ),
        },
        files: {
          [perStorageTimeSeriesNameGenerator]: this.extractMetricNamesForTimeSeries(
            timeSeriesCollectionSchemas?.files,
            perStorageTimeSeriesNameGenerator,
            'sum'
          ),
        },
      };
      return metrics;
    }
  ),

  /**
   * @type {{ rootSection: OneTimeSeriesChartsSectionSpec }}
   */
  dashboardSpec: computed(
    'inboundChartSpec',
    'outboundChartSpec',
    'currentProviderName',
    'spaceProvidersCount',
    function dashboardSpec() {
      const currentProviderName = this.currentProviderName;
      const tooltipTranslationKey = 'headerTooltip.' +
        (this.spaceProvidersCount > 1 ? 'manyProviders' : 'singleProvider');
      return {
        rootSection: {
          title: {
            content: String(this.t('header')),
            tip: String(this.t(tooltipTranslationKey, { currentProviderName })),
          },
          chartNavigation: 'sharedWithinSection',
          charts: [this.inboundChartSpec, this.outboundChartSpec],
        },
      };
    }
  ),

  /**
   * @type {ComputedProperty<OTSCChartDefinition>}
   */
  inboundChartSpec: computed(
    'currentProviderName',
    'metricNamesForTimeSeries',
    function inboundChartSpec() {
      const currentProviderName = this.currentProviderName;
      return {
        title: {
          content: String(this.t('titles.inbound.content')),
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
                        externalSourceName: 'chartData',
                        externalSourceParameters: {
                          collectionRef: 'bytes',
                          timeSeriesNameGenerator: totalTimeSeriesNameGenerator,
                          timeSeriesName: totalTimeSeriesNameGenerator,
                          metricNames: this.metricNamesForTimeSeries
                            .bytes[totalTimeSeriesNameGenerator],
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
                externalSourceName: 'chartData',
                externalSourceParameters: {
                  collectionRef: 'files',
                  timeSeriesNameGenerator: perStorageTimeSeriesNameGenerator,
                  metricNames: this.metricNamesForTimeSeries
                    .files[perStorageTimeSeriesNameGenerator],
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
      };
    }
  ),

  /**
   * @type {ComputedProperty<OTSCChartDefinition>}
   */
  outboundChartSpec: computed(
    'currentProviderName',
    'metricNamesForTimeSeries',
    function outboundChartSpec() {
      const currentProviderName = this.currentProviderName;
      return {
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
                externalSourceName: 'chartData',
                externalSourceParameters: {
                  collectionRef: 'bytes',
                  timeSeriesNameGenerator: perStorageTimeSeriesNameGenerator,
                  metricNames: this.metricNamesForTimeSeries
                    .bytes[perStorageTimeSeriesNameGenerator],
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
      };
    }
  ),

  /**
   * @type {ComputedProperty<OTSCExternalDataSources>}
   */
  chartsExternalDataSources: computed(function chartsExternalDataSources() {
    return {
      chartData: {
        fetchDynamicSeriesConfigs: (...args) =>
          this.fetchDynamicSeriesConfigs(...args),
      },
    };
  }),

  /**
   * @param {TimeSeriesCollectionSchema|undefined} timeSeriesCollectionSchema
   * @param {string} timeSeriesNameGenerator
   * @param {TimeSeriesMetricAggregator} timeSeriesMetricAggregator
   * @returns {Array<string>}
   */
  extractMetricNamesForTimeSeries(
    timeSeriesCollectionSchema,
    timeSeriesNameGenerator,
    timeSeriesMetricAggregator
  ) {
    const timeSeriesSchemas = timeSeriesCollectionSchema?.timeSeriesSchemas;
    const timeSeriesSchema =
      timeSeriesSchemas?.findBy('nameGenerator', timeSeriesNameGenerator);
    return getTimeSeriesMetricNamesWithAggregator(
      timeSeriesSchema,
      timeSeriesMetricAggregator
    );
  },

  /**
   * @param {{ collectionRef: QosTimeSeriesCollectionRef, timeSeriesNameGenerator: string, metricNames: Array<string> }} sourceParameters
   * @returns {Promise<Array<{ id: string, name: string, color: string, pointsSource: OTSCExternalDataSourceRefParameters }>>}
   */
  async fetchDynamicSeriesConfigs({
    collectionRef,
    timeSeriesNameGenerator,
    metricNames,
  }) {
    const colorGenerator = this.get('colorGenerator');
    return (await this.fetchStorageSeriesConfigs(collectionRef, timeSeriesNameGenerator))
      .map(({ timeSeriesName, storageId, storageLabel }) => ({
        id: storageId,
        name: storageLabel,
        color: colorGenerator.generateColorForKey(storageId),
        pointsSource: {
          externalSourceName: 'chartData',
          externalSourceParameters: {
            collectionRef,
            timeSeriesNameGenerator,
            timeSeriesName,
            metricNames,
          },
        },
      }));
  },

  /**
   * @param {QosTimeSeriesCollectionRef} collectionRef
   * @returns {Promise<Array<{ timeSeriesName, storageId, storageLabel }>>}
   */
  async fetchStorageSeriesConfigs(collectionRef, timeSeriesNameGenerator) {
    const {
      spaceId,
      storageManager,
      providerManager,
    } = this.getProperties(
      'spaceId',
      'storageManager',
      'providerManager',
    );

    const timeSeriesNames = Object.keys(
      (await this.getTimeSeriesCollectionLayout(collectionRef))
    );
    const storagesIds = timeSeriesNames
      ?.map((timeSeriesName) => {
        if (timeSeriesName.startsWith(timeSeriesNameGenerator)) {
          return timeSeriesName.slice(timeSeriesNameGenerator.length);
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
          timeSeriesName: `${timeSeriesNameGenerator}${storageId}`,
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
            `fetchStorageSeriesConfigs: cannot load storage with ID "${storageId}"`,
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
              `fetchStorageSeriesConfigs: cannot load provider with ID "${providerId}"`,
              error
            );
          }
        }
        let storageLabel = seriesEntry.storageName || String(this.t('unknownStorage', {
          id: storageId.slice(0, 6),
        }));
        if (seriesEntry.storageName) {
          storageLabel += ' ‐ ';
          storageLabel += seriesEntry.providerName || String(this.t('unknownProvider', {
            id: providerId.slice(0, 6),
          }));
        }
        seriesEntry.storageLabel = storageLabel;
        const providerSortKey =
          `${Number(!seriesEntry.providerName)}${seriesEntry.providerName || providerId}`;
        const storageSortKey =
          `${Number(!seriesEntry.storageName)}${seriesEntry.storageName || storageId}`;
        seriesEntry.sortKey = `${providerSortKey}\n${storageSortKey}`;
        return seriesEntry;
      })());
    }

    const seriesEntries = await allFulfilled(seriesPromises);
    return seriesEntries
      .sortBy('sortKey')
      .map(({ timeSeriesName, storageId, storageLabel }) =>
        ({ timeSeriesName, storageId, storageLabel })
      );
  },

  /**
   * @param {QosTimeSeriesCollectionRef} collectionRef
   * @returns {Promise<TimeSeriesCollectionLayout>}
   */
  async getTimeSeriesCollectionLayout(collectionRef) {
    return this.qosManager.getQosTransferTimeSeriesCollectionLayout(
      this.qosRequirementId,
      collectionRef,
    );
  },

  actions: {
    /**
     * @param {QosTimeSeriesCollectionRef} collectionRef
     * @returns {Promise<Array<TimeSeriesSchema>>}
     */
    async getTimeSeriesSchemas(collectionRef) {
      return (await this.timeSeriesCollectionSchemasProxy)
        ?.[collectionRef]?.timeSeriesSchemas;
    },

    /**
     * @param {{ batchedQuery: BatchedTimeSeriesQuery }} param
     * @returns {Promise<BatchedTimeSeriesQueryResult>}
     */
    async queryBatcherFetchData({ batchedQuery }) {
      const queryParams = {
        layout: batchedQuery.layout,
        startTimestamp: batchedQuery.startTimestamp,
        windowLimit: batchedQuery.windowLimit,
      };

      return this.qosManager.getQosTransferTimeSeriesCollectionSlice(
        this.qosRequirementId,
        batchedQuery.collectionRef,
        queryParams
      );
    },
  },
});
