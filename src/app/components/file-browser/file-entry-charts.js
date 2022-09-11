/**
 * Shows charts with size statistics for directory.
 *
 * @module components/file-browser/file-entry-charts
 * @author Agnieszka Warchoł
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get, computed, getProperties } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { all as allFulfilled } from 'rsvp';
import { promise } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import ColorGenerator from 'onedata-gui-common/utils/color-generator';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';

const timeSeriesNameGenerators = {
  regFileAndLinkCount: 'reg_file_and_link_count',
  dirCount: 'dir_count',
  totalSize: 'total_size',
  sizeOnStorage: 'storage_use_',
};

export default Component.extend(I18n, createDataProxyMixin('timeSeriesCollectionLayout'), {
  classNames: ['file-entry-charts'],

  i18n: service(),
  fileManager: service(),
  onedataConnection: service(),
  storageManager: service(),
  providerManager: service(),
  spaceManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fileEntryCharts',

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {DirStatsServiceState}
   */
  dirStatsServiceState: undefined,

  /**
   * @type {string}
   */
  fileId: reads('file.entityId'),

  /**
   * Timestamp of the last `timeSeriesCollectionLayout` proxy reload
   * @type {number}
   */
  lastTSCollectionLayoutReloadTimestamp: undefined,

  /**
   * @type {ComputedProperty<Utils.ColorGenerator>}
   */
  colorGenerator: computed(() => new ColorGenerator()),

  /**
   * Properties:
   * - directoriesCountColor: string
   * - regAndLinksCountColor: string
   * - bytesColor: string
   * @type {Object}
   */
  seriesColorsConfig: undefined,

  /**
   * @type {ComputedProperty<PromiseObject<TimeSeriesCollectionSchema>>}
   */
  timeSeriesCollectionSchemaProxy: promise.object(computed(
    function timeSeriesCollectionSchemaProxy() {
      return this.fileManager.getDirSizeStatsTimeSeriesCollectionSchema();
    }
  )),

  /**
   * @type {ComputedProperty<PromiseObject>}
   */
  loadingProxy: reads('timeSeriesCollectionSchemaProxy'),

  /**
   * Mapping time series name generator -> metric names.
   * @type {ComputedProperty<Object<string, Array<string>>>}
   */
  metricNamesForTimeSeries: computed(
    'timeSeriesCollectionSchemaProxy.content',
    function metricNamesForStorageTimeSeries() {
      return Object.values(timeSeriesNameGenerators)
        .reduce((acc, timeSeriesNameGenerator) => {
          acc[timeSeriesNameGenerator] =
            this.extractMetricNamesForTimeSeries(timeSeriesNameGenerator);
          return acc;
        }, {});
    }
  ),

  /**
   * @type {{ rootSection: OneTimeSeriesChartsSectionSpec }}
   */
  dashboardSpec: computed(
    'seriesColorsConfig',
    'metricNamesForTimeSeries',
    function dashboardSpec() {
      return {
        rootSection: {
          title: {
            content: String(this.t('header')),
            tip: String(this.t('headerTooltip')),
          },
          chartNavigation: 'sharedWithinSection',
          charts: [{
            title: {
              content: this.t('titles.fileCount.content'),
              tip: this.t('titles.fileCount.tip'),
            },
            yAxes: [{
              id: 'countAxis',
              name: String(this.t('axes.files')),
              minInterval: 1,
            }],
            seriesGroupBuilders: [{
              builderType: 'static',
              builderRecipe: {
                seriesGroupTemplate: {
                  id: 'totalCount',
                  name: String(this.t('seriesGroups.totalCount')),
                  stacked: true,
                  showSum: true,
                },
              },
            }],
            seriesBuilders: [{
              builderType: 'static',
              builderRecipe: {
                seriesTemplate: {
                  id: 'directoriesCount',
                  name: String(this.t('series.directoriesCount')),
                  color: this.seriesColorsConfig?.directoriesCountColor,
                  type: 'line',
                  yAxisId: 'countAxis',
                  groupId: 'totalCount',
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
                              timeSeriesNameGenerator: timeSeriesNameGenerators.dirCount,
                              timeSeriesName: timeSeriesNameGenerators.dirCount,
                              metricNames: this.metricNamesForTimeSeries
                                ?.[timeSeriesNameGenerators.dirCount] ?? [],
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
                                data: 'usePrevious',
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
              builderType: 'static',
              builderRecipe: {
                seriesTemplate: {
                  id: 'regAndLinksCount',
                  name: String(this.t('series.regAndLinksCount')),
                  color: this.seriesColorsConfig.regAndLinksCountColor,
                  type: 'line',
                  yAxisId: 'countAxis',
                  groupId: 'totalCount',
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
                              timeSeriesNameGenerator: timeSeriesNameGenerators
                                .regFileAndLinkCount,
                              timeSeriesName: timeSeriesNameGenerators
                                .regFileAndLinkCount,
                              metricNames: this.metricNamesForTimeSeries
                                ?.[timeSeriesNameGenerators.regFileAndLinkCount] ?? [],
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
                                data: 'usePrevious',
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
          }, {
            title: {
              content: this.t('titles.size.content'),
              tip: this.t('titles.size.tip'),
            },
            yAxes: [{
              id: 'bytesAxis',
              name: String(this.t('axes.bytes')),
              minInterval: 1,
              unitName: 'bytes',
            }],
            seriesGroupBuilders: [{
              builderType: 'dynamic',
              builderRecipe: {
                dynamicSeriesGroupConfigsSource: {
                  sourceType: 'external',
                  sourceSpec: {
                    externalSourceName: 'chartData',
                  },
                },
                seriesGroupTemplate: {
                  idProvider: {
                    functionName: 'literal',
                    functionArguments: {
                      data: 'totalPhysicalSize',
                    },
                  },
                  nameProvider: {
                    functionName: 'literal',
                    functionArguments: {
                      data: String(this.t('seriesGroups.totalPhysicalSize')),
                    },
                  },
                  stackedProvider: {
                    functionName: 'literal',
                    functionArguments: {
                      data: true,
                    },
                  },
                  showSumProvider: {
                    functionName: 'literal',
                    functionArguments: {
                      data: true,
                    },
                  },
                  subgroupsProvider: {
                    functionName: 'getDynamicSeriesGroupConfig',
                    functionArguments: {
                      propertyName: 'subgroups',
                    },
                  },
                },
              },
            }],
            seriesBuilders: [{
              builderType: 'static',
              builderRecipe: {
                seriesTemplate: {
                  id: 'totalLogicalSize',
                  name: String(this.t('series.totalLogicalSize')),
                  type: 'line',
                  color: this.seriesColorsConfig?.bytesColor,
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
                              timeSeriesNameGenerator: timeSeriesNameGenerators.totalSize,
                              timeSeriesName: timeSeriesNameGenerators.totalSize,
                              metricNames: this.metricNamesForTimeSeries
                                ?.[timeSeriesNameGenerators.totalSize] ?? [],
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
                                data: 'usePrevious',
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
                      timeSeriesNameGenerator: timeSeriesNameGenerators.sizeOnStorage,
                      metricNames: this.metricNamesForTimeSeries
                        ?.[timeSeriesNameGenerators.sizeOnStorage] ?? [],
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
                      data: 'bytesAxis',
                    },
                  },
                  groupIdProvider: {
                    functionName: 'getDynamicSeriesConfig',
                    functionArguments: {
                      propertyName: 'groupId',
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
                                data: 'usePrevious',
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
          }],
        },
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
        fetchDynamicSeriesGroupConfigs: (...args) =>
          this.fetchDynamicSeriesGroupConfigs(...args),
      },
    };
  }),

  init() {
    this._super();
    const colorGenerator = this.colorGenerator;
    const colors = {
      regAndLinksCountColor: colorGenerator.generateColorForKey('regAndLinksCount'),
      directoriesCountColor: colorGenerator.generateColorForKey('directoriesCount'),
      bytesColor: colorGenerator.generateColorForKey('bytes'),
    };
    this.set('seriesColorsConfig', colors);
  },

  /**
   * @param {TimeSeriesCollectionSchema|undefined} timeSeriesCollectionSchema
   * @param {string} timeSeriesNameGenerator
   * @returns {Array<string>}
   */
  extractMetricNamesForTimeSeries(timeSeriesNameGenerator) {
    const timeSeriesSchemas =
      this.timeSeriesCollectionSchemaProxy.content?.timeSeriesSchemas;
    const timeSeriesSchema =
      timeSeriesSchemas?.findBy('nameGenerator', timeSeriesNameGenerator);
    const metrics = timeSeriesSchema?.metrics ?? {};
    return Object.keys(metrics).filter((metricName) =>
      metrics[metricName]?.aggregator === 'last'
    );
  },

  /**
   * @param {{ collectionRef: string, timeSeriesNameGenerator: string, metricNames: Array<string> }} sourceParameters
   * @returns {Promise<Array<{ id: string, name: string, groupId: string, color: string, pointsSource: OTSCExternalDataSourceRefParameters }>>}
   */
  async fetchDynamicSeriesConfigs({
    timeSeriesNameGenerator,
    metricNames,
  }) {
    const spaceId = get(this.space, 'entityId');
    const timeSeriesNames = Object.keys(await this.getTimeSeriesCollectionLayout());
    const dynamicSeries = await allFulfilled(
      timeSeriesNames
      .filter((timeSeriesName) => timeSeriesName.startsWith(timeSeriesNameGenerator))
      .map(async (timeSeriesName) => {
        const storageId = timeSeriesName.replace(timeSeriesNameGenerator, '');
        let storageName = '';
        let providerName = '';
        let groupId;
        try {
          const storage = await this.storageManager.getStorageById(storageId, {
            throughSpaceId: spaceId,
            backgroundReload: false,
          });
          storageName = get(storage, 'name');
          // Fetching provider record instead of just taking `entityId` from
          // model relation to ensure, that provider is fetchable (and so
          // calculated group_id will exist).
          const provider = await get(storage, 'provider');
          groupId = `provider_${get(provider, 'entityId')}`;
          providerName = get(provider, 'name');
        } catch (error) {
          console.error(
            `component:file-browser/file-entry-charts#fetchDynamicSeriesConfigs: cannot load storage with ID "${storageId}"`,
            error
          );
          groupId = 'provider_unknown';
        }
        return {
          id: storageId,
          name: storageName || String(this.t('unknownStorage', {
            id: storageId.slice(0, 6),
          })),
          groupId,
          color: this.colorGenerator.generateColorForKey(storageId),
          pointsSource: {
            externalSourceName: 'chartData',
            externalSourceParameters: {
              timeSeriesNameGenerator,
              timeSeriesName,
              metricNames,
            },
          },
          // Preparing sorting key in a way, that will move unknown providers at the end
          // of series list and unknown storages at the end of provider series.
          sortKey: `${providerName ? '\t' + providerName : '\n'}${storageName ? '\t' + storageName : '\n'}`,
        };
      })
    );
    return dynamicSeries.sortBy('sortKey');
  },

  /**
   * @returns {Promise<Array<OTSCRawSeriesGroup>>}
   */
  async fetchDynamicSeriesGroupConfigs() {
    const providerList = await get(this.space, 'providerList');
    const providers = await get(providerList, 'list');
    const knownProvidersGroups = providers.sortBy('name').map((provider) => {
      const {
        entityId,
        name,
      } = getProperties(provider, 'entityId', 'name');
      return {
        id: `provider_${entityId}`,
        name,
        showSum: true,
      };
    });
    const allProvidersGroups = [...knownProvidersGroups, {
      id: 'provider_unknown',
      name: this.t('unknownProvider'),
      showSum: true,
    }];

    // There is only one dynamic series group - total physical size. So we don't
    // have to define all its properties here. Instead, these are placed in
    // chart configuration.
    return [{
      subgroups: allProvidersGroups,
    }];
  },

  /**
   * @returns {Promise<TimeSeriesCollectionLayout>}
   */
  async getTimeSeriesCollectionLayout() {
    const nowTimestamp = Math.floor(Date.now() / 1000);
    if (
      !this.lastTSCollectionLayoutReloadTimestamp ||
      nowTimestamp - this.lastTSCollectionLayoutReloadTimestamp >= 15
    ) {
      this.set('lastTSCollectionLayoutReloadTimestamp', nowTimestamp);
      return this.updateTimeSeriesCollectionLayoutProxy();
    } else {
      return this.getTimeSeriesCollectionLayoutProxy();
    }
  },

  /**
   * @override
   */
  async fetchTimeSeriesCollectionLayout() {
    return this.fileManager.getDirSizeStatsTimeSeriesCollectionLayout(this.fileId);
  },

  actions: {
    /**
     * @returns {Promise<Array<TimeSeriesSchema>>}
     */
    async getTimeSeriesSchemas() {
      return (await this.timeSeriesCollectionSchemaProxy)?.timeSeriesSchemas;
    },

    /**
     * @param {{ batchedQuery: BatchedTimeSeriesQuery }} param
     * @returns {Promise<TimeSeriesCollectionSlice>}
     */
    async queryBatcherFetchData({ batchedQuery }) {
      const queryParams = {
        layout: batchedQuery.layout,
        startTimestamp: batchedQuery.startTimestamp,
        windowLimit: batchedQuery.windowLimit,
      };

      const slice = await this.fileManager.getDirSizeStatsTimeSeriesCollectionSlice(
        this.fileId,
        queryParams
      );

      // Reject all points before statistics start time
      const statisticsStartDate = this.dirStatsServiceState.since;
      const timeSeriesSchemas =
        this.timeSeriesCollectionSchemaProxy.content?.timeSeriesSchemas ?? [];
      Object.keys(slice ?? {}).forEach((seriesName) => {
        Object.keys(slice[seriesName] ?? {}).forEach((metricName) => {
          const schema = timeSeriesSchemas.find((schemaToCheck) =>
            seriesName.startsWith(schemaToCheck.nameGenerator)
          );
          const timeResolution = schema?.metrics?.[metricName]?.resolution;
          const pointsArray = slice[seriesName][metricName];
          if (Array.isArray(pointsArray) && timeResolution && statisticsStartDate) {
            const metricStartDate = Math.floor(statisticsStartDate / timeResolution) *
              timeResolution;
            slice[seriesName][metricName] = pointsArray
              .filter(point => point.timestamp >= metricStartDate);
          }
        });
      });

      return slice;
    },
  },
});
