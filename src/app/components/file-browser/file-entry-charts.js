/**
 * Shows charts with size statistics for directory.
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get, computed, getProperties } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { promise } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import ColorGenerator from 'onedata-gui-common/utils/color-generator';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import Looper from 'onedata-gui-common/utils/looper';
import { getTimeSeriesMetricNamesWithAggregator } from 'onedata-gui-common/utils/time-series';
import {
  dirSizeStatsTimeSeriesNameGenerators as timeSeriesNameGenerators,
} from 'oneprovider-gui/models/file';
import { hashSettled, hash as hashFulfilled, all as allFulfilled } from 'rsvp';
import { formatNumber } from 'onedata-gui-common/helpers/format-number';
import bytesToString from 'onedata-gui-common/utils/bytes-to-string';

const mixins = [
  I18n,
  createDataProxyMixin('latestDirSizeStatsValues'),
];

export default Component.extend(...mixins, {
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
   * @type {Looper}
   */
  latestDirSizeStatsValuesUpdater: undefined,

  /**
   * @type {ComputedProperty<Boolean>}
   */
  areSizeStatsExpanded: false,

  /**
   * @type {ComputedProperty<string>}
   */
  currentProviderId: computed(function currentProviderId() {
    return this.providerManager.getCurrentProviderId();
  }),

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
  loadingProxy: promise.object(promise.all(
    'timeSeriesCollectionSchemaProxy',
    'latestDirSizeStatsValuesProxy',
  )),

  /**
   * Mapping time series name generator -> metric names.
   * @type {ComputedProperty<Object<string, Array<string>>>}
   */
  metricNamesForTimeSeries: computed(
    'timeSeriesCollectionSchemaProxy.content',
    function metricNamesForTimeSeries() {
      const timeSeriesSchemas =
        this.timeSeriesCollectionSchemaProxy.content?.timeSeriesSchemas;
      return Object.values(timeSeriesNameGenerators)
        .reduce((acc, timeSeriesNameGenerator) => {
          const timeSeriesSchema =
            timeSeriesSchemas?.findBy('nameGenerator', timeSeriesNameGenerator);
          acc[timeSeriesNameGenerator] =
            getTimeSeriesMetricNamesWithAggregator(timeSeriesSchema, 'last');
          return acc;
        }, {});
    }
  ),

  /**
   * @type {{ rootSection: OneTimeSeriesChartsSectionSpec }}
   */
  dashboardSpec: computed(
    'fileCountChartSpec',
    'sizeChartSpec',
    function dashboardSpec() {
      return {
        rootSection: {
          title: {
            content: String(this.t('historicalSize.header')),
            tip: String(this.t('historicalSize.headerTooltip')),
          },
          chartNavigation: 'sharedWithinSection',
          charts: [this.fileCountChartSpec, this.sizeChartSpec],
        },
      };
    }
  ),

  /**
   * @type {ComputedProperty<OTSCChartDefinition>}
   */
  fileCountChartSpec: computed(
    'seriesColorsConfig',
    'metricNamesForTimeSeries',
    'currentProviderId',
    function fileCountChartSpec() {
      return {
        title: {
          content: this.t('historicalSize.titles.fileCount.content'),
          tip: this.t('historicalSize.titles.fileCount.tip'),
        },
        yAxes: [{
          id: 'countAxis',
          name: String(this.t('historicalSize.axes.files')),
          minInterval: 1,
        }],
        seriesGroupBuilders: [{
          builderType: 'static',
          builderRecipe: {
            seriesGroupTemplate: {
              id: 'totalCount',
              name: String(this.t('historicalSize.seriesGroups.totalCount')),
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
              name: String(this.t('historicalSize.series.directoriesCount')),
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
                          collectionRef: this.currentProviderId,
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
              name: String(this.t('historicalSize.series.regAndLinksCount')),
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
                          collectionRef: this.currentProviderId,
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
      };
    }
  ),

  /**
   * @type {ComputedProperty<OTSCChartDefinition>}
   */
  sizeChartSpec: computed(
    'seriesColorsConfig',
    'metricNamesForTimeSeries',
    'currentProviderId',
    function sizeChartSpec() {
      return {
        title: {
          content: this.t('historicalSize.titles.size.content'),
          tip: this.t('historicalSize.titles.size.tip'),
        },
        yAxes: [{
          id: 'bytesAxis',
          name: String(this.t('historicalSize.axes.bytes')),
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
                  data: String(this.t('historicalSize.seriesGroups.totalPhysicalSize')),
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
              name: String(this.t('historicalSize.series.totalLogicalSize')),
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
                          collectionRef: this.currentProviderId,
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

  /**
   * @type {ComputedProperty<number>}
   */
  latestDirSizeStatsValuesLength: computed('latestDirSizeStatsValues',
    function latestDirSizeStatsValuesLength() {
      return Object.keys(this.latestDirSizeStatsValues).length;
    }
  ),

  /**
   * @type {ComputedProperty<string>}
   */
  currentSizeExtraInfo: computed(
    'latestDirSizeStatsValues',
    'latestDirSizeStatsValuesLength',
    function currentSizeExtraInfo() {
      if (!this.latestDirSizeStatsValues) {
        return '';
      }

      const providersWithStatsCount = Object.keys(this.latestDirSizeStatsValues)
        .filter((providerId) =>
          this.latestDirSizeStatsValues[providerId].type === 'result'
        )
        .length;

      return this.t('currentSize.currentSizeOnProvidersCount', {
        providersWithStatsCount,
        providersCount: this.latestDirSizeStatsValuesLength,
      });
    }
  ),

  /**
   * @type {ComputedProperty<Array<number>>}
   */
  latestLogicalSizeValues: computed('latestDirSizeStatsValues',
    function latestLogicalSizeValues() {
      return Object.values(this.latestDirSizeStatsValues).filter(
        dirStats => !dirStats.error).map(dirStats => dirStats.logicalSize);
    }
  ),

  /**
   * @type {ComputedProperty<number>}
   */
  minLogicalSize: computed('latestLogicalSizeValues', function minLogicalSize() {
    return Math.min(this.latestLogicalSizeValues);
  }),

  /**
   * @type {ComputedProperty<number>}
   */
  maxLogicalSize: computed('latestLogicalSizeValues', function maxLogicalSize() {
    return Math.max(this.latestLogicalSizeValues);
  }),

  /**
   * @type {ComputedProperty<Array<number>>}
   */
  latestFilesCountValues: computed('latestDirSizeStatsValues',
    function latestFilesCountValues() {
      return Object.values(this.latestDirSizeStatsValues).filter(
        dirStats => !dirStats.error).map(dirStats => dirStats.regFileAndLinkCount);
    }
  ),

  /**
   * @type {ComputedProperty<number>}
   */
  minFiles: computed('latestFilesCountValues', function minFiles() {
    return Math.min(this.latestFilesCountValues);
  }),

  /**
   * @type {ComputedProperty<number>}
   */
  maxFiles: computed('latestFilesCountValues', function minFiles() {
    return Math.max(this.latestFilesCountValues);
  }),

  /**
   * @type {ComputedProperty<Array<number>>}
   */
  latestDirsCountValues: computed('latestDirSizeStatsValues',
    function latestDirsCountValues() {
      return Object.values(this.latestDirSizeStatsValues).filter(
        dirStats => !dirStats.error).map(dirStats => dirStats.dirCount);
    }
  ),

  /**
   * @type {ComputedProperty<number>}
   */
  minDirs: computed('latestDirsCountValues', function minDirs() {
    return Math.min(this.latestDirsCountValues);
  }),

  /**
   * @type {ComputedProperty<number>}
   */
  maxDirs: computed('latestDirsCountValues', function minDirs() {
    return Math.max(this.latestDirsCountValues);
  }),

  /**
   * @type {ComputedProperty<string>}
   */
  stringifiedLatestElementsCount: computed(
    'minFiles',
    function stringifiedLatestElementsCount() {
      let fileCount = this.minFiles;
      let dirCount = this.minDirs;
      if (this.minFiles !== this.maxFiles) {
        fileCount = ' – ' + this.maxFiles;
      }
      if (this.minDirs !== this.maxDirs) {
        dirCount += ' – ' + this.maxDirs;
      }

      const filesNounVer = this.maxFiles === 1 ? 'singular' : 'plural';
      const dirNounVer = this.maxDirs === 1 ? 'singular' : 'plural';

      return this.t('currentSize.elementsCount.template', {
        fileCount,
        dirCount,
        fileNoun: this.t(`currentSize.elementsCount.file.${filesNounVer}`),
        dirNoun: this.t(`currentSize.elementsCount.dir.${dirNounVer}`),
      });
    }
  ),

  /**
   * @type {ComputedProperty<string>}
   */
  stringifiedLatestElementsCountExtraInfo: computed(
    'minFiles',
    function stringifiedLatestElementsCount() {
      let totalCount = this.minFiles + this.minDirs;

      if ((this.minFiles !== this.maxFiles) || (this.minDirs !== this.maxDirs)) {
        const maxTotalCount = this.maxFiles + this.maxDirs;
        totalCount += ' – ' + maxTotalCount;
      }

      const elementNounVer = (this.maxFiles + this.maxDirs) === 1 ? 'singular' : 'plural';
      return this.t('currentSize.elementsCount.templateExtraInfo', {
        totalCount,
        elementNoun: this.t(`currentSize.elementsCount.element.${elementNounVer}`),
      });
    }
  ),

  /**
   * @type {ComputedProperty<string>}
   */
  logicalSizeExtraInfo: computed('', function logicalSizeExtraInfo() {
    if (this.maxLogicalSize >= 1024) {
      let logicalSize = formatNumber(this.minLogicalSize);
      if (this.minLogicalSize !== this.maxLogicalSize) {
        logicalSize += ' – ' + this.maxLogicalSize;
      }
      return logicalSize;
    } else {
      return '';
    }
  }),

  /**
   * @type {ComputedProperty<number>}
   */
  physicalSize: computed('latestDirSizeStatsValues', function physicalSize() {
    return Object.values(this.latestDirSizeStatsValues || {}).reduce((acc, stats) => {
      return acc + (stats.physicalSize ?? 0);
    }, 0);
  }),

  /**
   * @type {ComputedProperty<string>}
   */
  physicalSizeExtraInfo: computed('physicalSize', function physicalSizeExtraInfo() {
    if (this.physicalSize >= 1024) {
      return formatNumber(this.physicalSize);
    } else {
      return '';
    }
  }),

  /**
   * @override
   */
  init() {
    this._super(...arguments);

    const colorGenerator = this.colorGenerator;
    const seriesColorsConfig = {
      regAndLinksCountColor: colorGenerator.generateColorForKey('regAndLinksCount'),
      directoriesCountColor: colorGenerator.generateColorForKey('directoriesCount'),
      bytesColor: colorGenerator.generateColorForKey('bytes'),
    };

    const latestDirSizeStatsValuesUpdater = Looper.create({
      immediate: false,
      interval: 5000,
    });
    latestDirSizeStatsValuesUpdater.on('tick', () =>
      this.updateLatestDirSizeStatsValuesProxy({ replace: true })
    );

    this.setProperties({
      seriesColorsConfig,
      latestDirSizeStatsValuesUpdater,
    });
  },

  /**
   * @override
   */
  willDestroyElement() {
    try {
      this.latestDirSizeStatsValuesUpdater?.destroy();
    } finally {
      this._super(...arguments);
    }
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
    const dynamicSeriesPromises = [];
    const collectionLayouts = await this.getTimeSeriesCollectionLayouts();
    const providerIds = Object.keys(collectionLayouts);
    const providers = await hashFulfilled(providerIds.reduce((acc, providerId) => {
      acc[providerId] = this.providerManager.getProviderById(providerId, {
        throughSpaceId: spaceId,
      });
      return acc;
    }, {}));
    providerIds.forEach((providerId) => {
      const provider = providers[providerId];
      const providerCollectionLayout = collectionLayouts[providerId];
      const dynamicTimeSeriesNames = Object.keys(providerCollectionLayout)
        .filter((timeSeriesName) => timeSeriesName.startsWith(timeSeriesNameGenerator));
      dynamicTimeSeriesNames.forEach((timeSeriesName) => {
        dynamicSeriesPromises.push((async () => {
          const storageId = timeSeriesName.replace(timeSeriesNameGenerator, '');
          let storageName = '';
          const providerName = get(provider, 'name');
          try {
            const storage = await this.storageManager.getStorageById(storageId, {
              throughSpaceId: spaceId,
              backgroundReload: false,
            });
            storageName = get(storage, 'name');
          } catch (error) {
            console.error(
              `component:file-browser/file-entry-charts#fetchDynamicSeriesConfigs: cannot load storage with ID "${storageId}"`,
              error
            );
          }
          return {
            id: storageId,
            name: storageName || String(this.t('historicalSize.unknownStorage', {
              id: storageId.slice(0, 6),
            })),
            groupId: `provider_${providerId}`,
            color: this.colorGenerator.generateColorForKey(storageId),
            pointsSource: {
              externalSourceName: 'chartData',
              externalSourceParameters: {
                collectionRef: providerId,
                timeSeriesNameGenerator,
                timeSeriesName,
                metricNames,
              },
            },
            // Preparing sorting key in a way, that will move unknown storages
            // at the end of provider series.
            sortKey: `${providerName}${storageName ? '\t' + storageName : '\n'}`,
          };
        })());
      });
    });
    const dynamicSeries = await allFulfilled(dynamicSeriesPromises);
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

    // There is only one dynamic series group - total physical size. So we don't
    // have to define all its properties here. Instead, these are placed in
    // chart configuration.
    return [{
      subgroups: knownProvidersGroups,
    }];
  },

  /**
   * @returns {Promise<Object<string, TimeSeriesCollectionLayout>>}
   *   map providerId -> TS collection layout for that provider
   */
  async getTimeSeriesCollectionLayouts() {
    const providerList = await get(this.space, 'providerList');
    const providers = await get(providerList, 'list');
    const allProvidersLayouts = await hashSettled(providers.reduce((acc, provider) => {
      const providerId = get(provider, 'entityId');
      acc[providerId] = this.fileManager
        .getDirSizeStatsTimeSeriesCollectionLayout(this.fileId, providerId);
      return acc;
    }, {}));
    return Object.keys(allProvidersLayouts).reduce((acc, providerId) => {
      if (allProvidersLayouts[providerId].state === 'fulfilled') {
        acc[providerId] = allProvidersLayouts[providerId].value;
      }
      return acc;
    }, {});
  },

  /**
   * @override
   * @returns {Promise<DirCurrentSizeStats>}
   */
  async fetchLatestDirSizeStatsValues() {
    return this.fileManager.getDirCurrentSizeStats(this.fileId);
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
        batchedQuery.collectionRef,
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
    toggleSizeStats() {
      this.toggleProperty('areSizeStatsExpanded');
    },
  },
});
