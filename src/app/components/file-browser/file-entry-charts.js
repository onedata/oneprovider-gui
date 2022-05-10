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
   * @type {DirSizeStatsConfig}
   */
  dirSizeStatsConfig: undefined,

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
          seriesGroups: [{
            factoryName: 'static',
            factoryArguments: {
              seriesGroupTemplate: {
                id: 'totalCount',
                name: String(this.t('seriesGroups.totalCount')),
                stack: true,
                showSeriesSum: true,
              },
            },
          }],
          series: [{
            factoryName: 'static',
            factoryArguments: {
              seriesTemplate: {
                id: 'directoriesCount',
                name: String(this.t('series.directoriesCount')),
                color: this.get('seriesColorsConfig.directoriesCountColor'),
                type: 'line',
                yAxisId: 'countAxis',
                groupId: 'totalCount',
                data: {
                  functionName: 'loadSeries',
                  functionArguments: {
                    sourceType: 'external',
                    sourceParameters: {
                      externalSourceName: 'dirStatisticsData',
                      externalSourceParameters: {
                        seriesId: 'dir_count',
                      },
                    },
                    replaceEmptyOptions: {
                      strategy: 'usePrevious',
                      fallbackValue: 0,
                    },
                  },
                },
              },
            },
          }, {
            factoryName: 'static',
            factoryArguments: {
              seriesTemplate: {
                id: 'regAndLinksCount',
                name: String(this.t('series.regAndLinksCount')),
                color: this.get('seriesColorsConfig.regAndLinksCountColor'),
                type: 'line',
                yAxisId: 'countAxis',
                groupId: 'totalCount',
                data: {
                  functionName: 'loadSeries',
                  functionArguments: {
                    sourceType: 'external',
                    sourceParameters: {
                      externalSourceName: 'dirStatisticsData',
                      externalSourceParameters: {
                        seriesId: 'reg_file_and_link_count',
                      },
                    },
                    replaceEmptyOptions: {
                      strategy: 'usePrevious',
                      fallbackValue: 0,
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
            valueFormatter: {
              functionName: 'asBytes',
              functionArguments: {
                data: {
                  functionName: 'supplyValue',
                },
              },
            },
          }],
          seriesGroups: [{
            factoryName: 'dynamic',
            factoryArguments: {
              dynamicSeriesGroupConfigsSource: {
                sourceType: 'external',
                sourceParameters: {
                  externalSourceName: 'dirStatisticsData',
                },
              },
              seriesGroupTemplate: {
                id: {
                  functionName: 'getDynamicSeriesGroupConfigData',
                  functionArguments: {
                    propertyName: 'id',
                  },
                },
                name: {
                  functionName: 'getDynamicSeriesGroupConfigData',
                  functionArguments: {
                    propertyName: 'name',
                  },
                },
                stack: true,
                showSeriesSum: true,
              },
            },
          }],
          series: [{
            factoryName: 'static',
            factoryArguments: {
              seriesTemplate: {
                id: 'totalSize',
                name: String(this.t('series.totalSize')),
                type: 'line',
                yAxisId: 'bytesAxis',
                data: {
                  functionName: 'loadSeries',
                  functionArguments: {
                    sourceType: 'external',
                    sourceParameters: {
                      externalSourceName: 'dirStatisticsData',
                      externalSourceParameters: {
                        seriesId: 'total_size',
                      },
                    },
                    replaceEmptyOptions: {
                      strategy: 'usePrevious',
                      fallbackValue: 0,
                    },
                  },
                },
              },
            },
          }, {
            factoryName: 'dynamic',
            factoryArguments: {
              dynamicSeriesConfigsSource: {
                sourceType: 'external',
                sourceParameters: {
                  externalSourceName: 'dirStatisticsData',
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
                yAxisId: 'bytesAxis',
                groupId: {
                  functionName: 'getDynamicSeriesConfigData',
                  functionArguments: {
                    propertyName: 'groupId',
                  },
                },
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
                    replaceEmptyOptions: {
                      strategy: 'usePrevious',
                      fallbackValue: 0,
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
              this.fetchDynamicSeriesGroupConfigs(...args),
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
    const dirSizeStatsConfig = this.get('dirSizeStatsConfig');
    const statisticsStartDate = get(dirSizeStatsConfig, 'since');
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
  async fetchDynamicSeriesConfigs() {
    const colorGenerator = this.get('colorGenerator');
    const storageManager = this.get('storageManager');
    const spaceId = this.get('space.entityId');
    const dynamicSeriesName = 'storage_use_';
    const tsCollections = await this.getTsCollections();
    return await allFulfilled(Object.keys(tsCollections)
      .filter(name => name.startsWith(dynamicSeriesName))
      .map(async (tsName) => {
        const storageId = tsName.replace(dynamicSeriesName, '');
        let storage_name;
        let groupId;
        try {
          const storage = await storageManager.getStorageById(storageId, {
            throughSpaceId: spaceId,
            backgroundReload: false,
          });
          storage_name = storage.get('name');
          groupId = `provider_${storage.relationEntityId('provider')}`;
        } catch (error) {
          console.error(
            `component:file-browser/file-entry-charts#fetchDynamicSeriesConfigs: cannot load storage with ID "${storageId}"`,
            error
          );
          storage_name = 'Storage#' + storageId.slice(0, 6);
          groupId = 'provider_unknown';
        }
        return {
          id: storageId,
          name: storage_name,
          groupId: groupId,
          color: colorGenerator.generateColorForKey(storageId),
          pointsSource: {
            externalSourceName: 'dirStatisticsData',
            externalSourceParameters: {
              seriesId: tsName,
            },
          },
        };
      })
    );
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
   * @returns {Promise<Array<{ id: string, name: string }>>}
   */
  async fetchDynamicSeriesGroupConfigs() {
    const currentProvider = await this.get('providerManager').getCurrentProvider();
    const {
      entityId,
      name,
    } = getProperties(currentProvider, 'entityId', 'name');
    return [{
        id: `provider_${entityId}`,
        name,
      },
      {
        id: 'provider_unknown',
        name: 'Unknown provider',
      },
    ];
  },
});
