/**
 * Shows charts with size statistics for directory.
 *
 * @module components/file-browser/file-entry-charts
 * @author Agnieszka Warchoł
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
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

export default Component.extend(I18n, createDataProxyMixin('tsCollections'), {
  classNames: ['file-entry-charts'],

  i18n: service(),
  fileManager: service(),
  onedataConnection: service(),
  storageManager: service(),

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
   * @virtual optional
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
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
   * @type {Object}
   */
  chartsColor: undefined,

  /**
   * @type {ComputedProperty<dirStatsConfig>}
   */
  dirStatsConfig: reads('onedataConnection.dirStatsConfig'),

  /**
   * @type {ComputedProperty<number>}
   */
  globalTimeSecondsOffset: reads('onedataConnection.globalTimeSecondsOffset'),

  /**
   * @type {Array<FileEntryChartTimeResolution>}
   */
  timeResolutionSpecs: computed(
    'dirStatsConfig',
    function timeResolutionSpecs() {
      const dirStatsConfig = this.get('dirStatsConfig') || {};
      return [{
        metricId: dirStatsConfig.minuteMetricId,
        timeResolution: 60,
        pointsCount: 30,
        updateInterval: 10,
      }, {
        metricId: dirStatsConfig.hourMetricId,
        timeResolution: 60 * 60,
        pointsCount: 24,
        updateInterval: 30,
      }, {
        metricId: dirStatsConfig.dayMetricId,
        timeResolution: 24 * 60 * 60,
        pointsCount: 30,
        updateInterval: 30,
      }, {
        metricId: dirStatsConfig.monthMetricId,
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
          },
          yAxes: [{
            id: 'countAxis',
            name: String(this.t('axes.files')),
            minInterval: 1,
          }],
          series: [{
            factoryName: 'static',
            factoryArguments: {
              seriesTemplate: {
                id: 'directoriesCount',
                name: String(this.t('series.directoriesCount')),
                color: this.get('chartsColor.directoriesCountColor'),
                type: 'line',
                yAxisId: 'countAxis',
                stackId: 'totalCount',
                data: {
                  functionName: 'replaceEmpty',
                  functionArguments: {
                    data: {
                      functionName: 'loadSeries',
                      functionArguments: {
                        sourceType: 'external',
                        sourceParameters: {
                          externalSourceName: 'filesCountData',
                          externalSourceParameters: {
                            seriesId: 'dir_count',
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
                id: 'filesCount',
                name: String(this.t('series.filesCount')),
                color: this.get('chartsColor.filesCountColor'),
                type: 'line',
                yAxisId: 'countAxis',
                stackId: 'totalCount',
                data: {
                  functionName: 'replaceEmpty',
                  functionArguments: {
                    data: {
                      functionName: 'loadSeries',
                      functionArguments: {
                        sourceType: 'external',
                        sourceParameters: {
                          externalSourceName: 'filesCountData',
                          externalSourceParameters: {
                            seriesId: 'reg_file_and_link_count',
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
          filesCountData: {
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
            color: this.get('chartsColor.bytesColor'),
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
            factoryName: 'static',
            factoryArguments: {
              seriesTemplate: {
                id: 'totalSize',
                name: String(this.t('series.totalSize')),
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
                          externalSourceName: 'filesCountData',
                          externalSourceParameters: {
                            seriesId: 'total_size',
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
                  externalSourceName: 'filesCountData',
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
                stackId: 'perStorageSize',
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
          filesCountData: {
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
   * @param {{ collectionId: string, seriesId: string }} sourceParameters
   * @returns {Promise<Array<RawOTSCSeriesPoint>>}
   */
  async fetchSeries(seriesParameters, sourceParameters) {
    const {
      timeResolutionSpecs,
      timeSeriesQueryBatcher,
    } = this.getProperties('timeResolutionSpecs', 'timeSeriesQueryBatcher');
    const statisticsStartDate = this.get('space.statisticsStartDate');
    const matchingTimeResolutionSpec = timeResolutionSpecs
      .findBy('timeResolution', seriesParameters.timeResolution);
    const metricId = matchingTimeResolutionSpec ?
      matchingTimeResolutionSpec.metricId : null;
    if (!metricId) {
      return [];
    }
    if (seriesParameters.lastPointTimestamp < statisticsStartDate) {
      return [];
    }
    const queryParams = {
      seriesId: sourceParameters.seriesId,
      metricId,
      startTimestamp: seriesParameters.lastPointTimestamp,
      limit: seriesParameters.pointsCount,
    };
    return (await timeSeriesQueryBatcher.query(queryParams))
      .filter(point => point.timestamp >= statisticsStartDate);
  },

  /**
   * @returns { Promise < Array < { id: string, name: string, color: string, pointsSource: OTSCExternalDataSourceRefParameters } >> }
   */
  async fetchDynamicSeriesConfigs() {
    const colorGenerator = this.get('colorGenerator');
    const storageManager = this.get('storageManager');
    const spaceId = this.get('space.entityId');
    const dynamicSeriesName = 'size_on_storage_';
    const tsCollections = await this.getTsCollections();

    return await allFulfilled(tsCollections.dirStats
      .filter(name => name.startsWith(dynamicSeriesName))
      .map(async (tsName) => {
        const storageId = tsName.replace(dynamicSeriesName, '');
        const storage = await storageManager.getStorageById(storageId, {
          throughSpaceId: spaceId,
          backgroundReload: false,
        });
        return {
          id: storageId,
          name: storage.get('name'),
          color: colorGenerator.generateColorForKey(storageId),
          pointsSource: {
            externalSourceName: 'filesCountData',
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
      filesCountColor: colorGenerator.generateColorForKey('filesCount'),
      directoriesCountColor: colorGenerator.generateColorForKey('directoriesCount'),
      bytesColor: colorGenerator.generateColorForKey('bytes'),
    };
    this.set('chartsColor', colors);
    console.log(typeof this.get('chartsColor'));
  },
});
