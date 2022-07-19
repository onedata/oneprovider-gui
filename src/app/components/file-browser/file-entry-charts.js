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
import I18n from 'onedata-gui-common/mixins/components/i18n';
import ColorGenerator from 'onedata-gui-common/utils/color-generator';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import OTSCConfiguration from 'onedata-gui-common/utils/one-time-series-chart/configuration';
import OTSCModel from 'onedata-gui-common/utils/one-time-series-chart/model';
import QueryBatcher from 'onedata-gui-common/utils/one-time-series-chart/query-batcher';

/**
 * @typedef {Object} FileEntryChartTimeResolution
 * @property {string} metricId
 * @property {number} timeResolution
 * @property {number} pointsCount
 * @property {number} updateInterval
 */

/**
 * @typedef {Object} DirStatsMetricIds
 * @property {string} dayMetricId
 * @property {string} hourMetricId
 * @property {string} minuteMetricId
 * @property {string} monthMetricId
 */

export default Component.extend(I18n, createDataProxyMixin('tsCollections'), {
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
   * Timestamp of the last timeSeriesCollections proxy reload
   * @type {number}
   */
  lastTsCollectionsReloadTimestamp: undefined,

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
   * @type {String}
   */
  spaceEntityId: reads('space.entityId'),

  /**
   * @type {DirStatsMetricIds}
   */
  dirStatsMetricIds: Object.freeze({
    monthMetricId: 'month',
    minuteMetricId: 'minute',
    hourMetricId: 'hour',
    dayMetricId: 'day',
  }),

  /**
   * @type {ComputedProperty<number>}
   */
  globalTimeSecondsOffset: reads('onedataConnection.globalTimeSecondsOffset'),

  /**
   * @type {Array<FileEntryChartTimeResolution>}
   */
  timeResolutionSpecs: computed(
    'dirStatsMetricIds',
    function timeResolutionSpecs() {
      const dirStatsMetricIds = this.get('dirStatsMetricIds') || {};
      return [{
        metricId: dirStatsMetricIds.minuteMetricId,
        timeResolution: 60,
        pointsCount: 30,
        updateInterval: 10,
      }, {
        metricId: dirStatsMetricIds.hourMetricId,
        timeResolution: 60 * 60,
        pointsCount: 24,
        updateInterval: 30,
      }, {
        metricId: dirStatsMetricIds.dayMetricId,
        timeResolution: 24 * 60 * 60,
        pointsCount: 30,
        updateInterval: 30,
      }, {
        metricId: dirStatsMetricIds.monthMetricId,
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
    'fileId',
    function timeSeriesQueryBatcher() {
      const {
        fileManager,
        fileId,
      } = this.getProperties('fileManager', 'fileId');
      return new QueryBatcher({
        fetchData: (batchedQuery) =>
          fileManager.queryTimeSeriesMetrics(
            fileId, {
              layout: batchedQuery.metrics,
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
  filesCountChartConfig: computed(
    'timeResolutionSpecs',
    'globalTimeSecondsOffset',
    function filesCountChartConfig() {
      const {
        timeResolutionSpecs,
        globalTimeSecondsOffset,
      } = this.getProperties('timeResolutionSpecs', 'globalTimeSecondsOffset');
      const config = new OTSCConfiguration({
        nowTimestampOffset: globalTimeSecondsOffset || 0,
        chartDefinition: {
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
                color: this.get('seriesColorsConfig.directoriesCountColor'),
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
                          externalSourceName: 'dirStatisticsData',
                          externalSourceParameters: {
                            seriesId: 'dir_count',
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
                color: this.get('seriesColorsConfig.regAndLinksCountColor'),
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
                          externalSourceName: 'dirStatisticsData',
                          externalSourceParameters: {
                            seriesId: 'reg_file_and_link_count',
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
        },
        timeResolutionSpecs,
        externalDataSources: {
          dirStatisticsData: {
            fetchSeries: (...args) => this.fetchSeries(...args),
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
  filesSizeChartConfig: computed(
    'timeResolutionSpecs',
    'globalTimeSecondsOffset',
    function filesSizeChartConfig() {
      const {
        timeResolutionSpecs,
        globalTimeSecondsOffset,
      } = this.getProperties('timeResolutionSpecs', 'globalTimeSecondsOffset');
      const config = new OTSCConfiguration({
        nowTimestampOffset: globalTimeSecondsOffset || 0,
        chartDefinition: {
          title: {
            content: this.t('titles.size.content'),
            tip: this.t('titles.size.tip'),
          },
          yAxes: [{
            id: 'bytesAxis',
            name: String(this.t('axes.bytes')),
            color: this.get('seriesColorsConfig.bytesColor'),
            minInterval: 1,
            unitName: 'bytes',
          }],
          seriesGroupBuilders: [{
            builderType: 'dynamic',
            builderRecipe: {
              dynamicSeriesGroupConfigsSource: {
                sourceType: 'external',
                sourceSpec: {
                  externalSourceName: 'dirStatisticsData',
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
                yAxisId: 'bytesAxis',
                dataProvider: {
                  functionName: 'loadSeries',
                  functionArguments: {
                    sourceType: 'external',
                    sourceSpecProvider: {
                      functionName: 'literal',
                      functionArguments: {
                        data: {
                          externalSourceName: 'dirStatisticsData',
                          externalSourceParameters: {
                            seriesId: 'total_size',
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
                  externalSourceName: 'dirStatisticsData',
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
        },
        timeResolutionSpecs,
        externalDataSources: {
          dirStatisticsData: {
            fetchSeries: (...args) => this.fetchSeries(...args),
            fetchDynamicSeriesGroupConfigs: (...args) =>
              this.fetchFileSizeDynamicSeriesGroupConfigs(...args),
            fetchDynamicSeriesConfigs: (...args) =>
              this.fetchFileSizeDynamicSeriesConfigs(...args),
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
  filesCountChartModel: computed(
    'filesCountChartConfig',
    function filesCountChartModel() {
      return OTSCModel.create({
        configuration: this.get('filesCountChartConfig'),
      });
    }
  ),

  /**
   * @type {ComputedProperty<Utils.OneTimeSeriesChart.Model>}
   */
  filesSizeChartModel: computed(
    'filesSizeChartConfig',
    function filesSizeChartModel() {
      return OTSCModel.create({
        configuration: this.get('filesSizeChartConfig'),
      });
    }
  ),

  init() {
    this._super();
    const colorGenerator = this.get('colorGenerator');
    const colors = {
      regAndLinksCountColor: colorGenerator.generateColorForKey('regAndLinksCount'),
      directoriesCountColor: colorGenerator.generateColorForKey('directoriesCount'),
      bytesColor: colorGenerator.generateColorForKey('bytes'),
    };
    this.set('seriesColorsConfig', colors);
  },

  /**
   * @override
   */
  willDestroyElement() {
    try {
      const {
        filesCountChartModel,
        filesSizeChartModel,
      } = this.getProperties('filesCountChartModel', 'filesSizeChartModel');
      filesCountChartModel.destroy();
      filesSizeChartModel.destroy();
    } finally {
      this._super(...arguments);
    }
  },

  /**
   * @param {OTSCDataSourceFetchParams} seriesParameters
   * @param {{ seriesId: string }} sourceParameters
   * @returns {Promise<Array<RawOTSCSeriesPoint>>}
   */
  async fetchSeries(seriesParameters, sourceParameters) {
    const {
      timeResolutionSpecs,
      timeSeriesQueryBatcher,
    } = this.getProperties('timeResolutionSpecs', 'timeSeriesQueryBatcher');
    const dirStatsServiceState = this.get('dirStatsServiceState');
    const statisticsStartDate = get(dirStatsServiceState, 'since');
    const matchingTimeResolutionSpec = timeResolutionSpecs
      .findBy('timeResolution', seriesParameters.timeResolution);
    const metricId = matchingTimeResolutionSpec ?
      matchingTimeResolutionSpec.metricId : null;
    if (!metricId) {
      return [];
    }
    const timeResolution = matchingTimeResolutionSpec.timeResolution;
    const metricStartDate = Math.floor(statisticsStartDate / timeResolution) *
      timeResolution;
    if (seriesParameters.lastPointTimestamp < metricStartDate) {
      return [];
    }
    const queryParams = {
      seriesId: sourceParameters.seriesId,
      metricId,
      startTimestamp: seriesParameters.lastPointTimestamp,
      limit: seriesParameters.pointsCount,
    };
    return (await timeSeriesQueryBatcher.query(queryParams))
      .filter(point => point.timestamp >= metricStartDate);
  },

  /**
   * @returns {Promise<Array<{ id: string, name: string, color: string, pointsSource: OTSCExternalDataSourceRefParameters }>>}
   */
  async fetchFileSizeDynamicSeriesConfigs() {
    const colorGenerator = this.get('colorGenerator');
    const storageManager = this.get('storageManager');
    const spaceId = this.get('space.entityId');
    const dynamicSeriesName = 'storage_use_';
    const tsCollections = await this.getTsCollections();
    const dynamicSeries = await allFulfilled(Object.keys(tsCollections)
      .filter(name => name.startsWith(dynamicSeriesName))
      .map(async (tsName) => {
        const storageId = tsName.replace(dynamicSeriesName, '');
        let storageName = '';
        let providerName = '';
        let groupId;
        try {
          const storage = await storageManager.getStorageById(storageId, {
            throughSpaceId: spaceId,
            backgroundReload: false,
          });
          storageName = storage.get('name');
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
          color: colorGenerator.generateColorForKey(storageId),
          pointsSource: {
            externalSourceName: 'dirStatisticsData',
            externalSourceParameters: {
              seriesId: tsName,
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
   * @override
   */
  async fetchTsCollections() {
    const {
      fileManager,
      fileId,
    } = this.getProperties(
      'fileManager',
      'fileId',
    );
    return fileManager.getTimeSeriesCollections(fileId);
  },

  /**
   * @returns {Promise<FileEntryTimeSeriesCollections>}
   */
  async getTsCollections() {
    const lastTsCollectionsReloadTimestamp =
      this.get('lastTsCollectionsReloadTimestamp');
    const nowTimestamp = Math.floor(Date.now() / 1000);
    if (
      !lastTsCollectionsReloadTimestamp ||
      nowTimestamp - lastTsCollectionsReloadTimestamp > 30
    ) {
      this.set('lastTsCollectionsReloadTimestamp', nowTimestamp);
      return this.updateTsCollectionsProxy();
    } else {
      return this.getTsCollectionsProxy();
    }
  },

  /**
   * @returns {Promise<Array<{ id: string, name: string }>>}
   */
  async fetchFileSizeDynamicSeriesGroupConfigs() {
    const space = this.get('space');
    const providerList = await get(space, 'providerList');
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
});
