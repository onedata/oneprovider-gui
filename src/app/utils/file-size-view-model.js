/**
 * Implements behavior and provides state of file size view (see set of
 * `file-size` components), that is typically rendered as a tab in file-info-modal.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { get, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { eq, getBy } from 'ember-awesome-macros';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { SpaceSizeStatsType } from 'oneprovider-gui/services/production/file-manager';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import Looper from 'onedata-gui-common/utils/looper';

const mixins = [
  OwnerInjector,
  createDataProxyMixin('completeLatestDirSizeStatsValues'),
];

export default EmberObject.extend(...mixins, {
  fileManager: service(),

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual
   * @type {DirStatsServiceState}
   */
  dirStatsServiceState: undefined,

  /**
   * @virtual
   * @type {({ providerId: string }) => string}
   */
  getProvidersUrl: undefined,

  /**
   * Tells which type of stats should be rendered. Applicable only when
   * browsing space root directory stats.
   * @type {SpaceSizeStatsType}
   */
  activeTab: SpaceSizeStatsType.All,

  /**
   * @type {boolean}
   */
  dirStatsNotReady: false,

  /**
   * @type {Looper}
   */
  completeLatestDirSizeStatsValuesUpdater: undefined,

  /**
   * @type {ComputedProperty<boolean>}
   */
  isSpaceRootDir: eq('file.entityId', 'space.rootDir.entityId'),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isSizeStatsDisabled: computed(
    'dirStatsServiceState.status',
    function isSizeStatsDisabled() {
      return ['disabled', 'stopping'].includes(this.dirStatsServiceState?.status);
    }
  ),

  /**
   * @type {ComputedProperty<DirCurrentSizeStats | undefined>}
   */
  latestDirSizeStatsValues: getBy('completeLatestDirSizeStatsValues', 'activeTab'),

  /**
   * @type {ComputedProperty<{ [key in SpaceSizeStatsType]?: number }>}
   */
  completeTotalPhysicalSizes: computed(
    'completeLatestDirSizeStatsValues',
    function totalPhysicalSizes() {
      const totalSizes = {};
      Object.keys(this.completeLatestDirSizeStatsValues ?? {}).forEach((statsType) => {
        totalSizes[statsType] =
          Object.values(this.completeLatestDirSizeStatsValues[statsType] || {})
          .reduce((acc, stats) => {
            return acc + (stats.totalPhysicalSize ?? 0);
          }, 0);
      });
      return totalSizes;
    }
  ),

  /**
   * @type {ComputedProperty<number | undefined>}
   */
  totalPhysicalSize: getBy('completeTotalPhysicalSizes', 'activeTab'),

  /**
   * @override
   */
  init() {
    this._super(...arguments);

    const completeLatestDirSizeStatsValuesUpdater = Looper.create({
      immediate: false,
      interval: 5000,
    });
    completeLatestDirSizeStatsValuesUpdater.on('tick', () =>
      this.updateCompleteLatestDirSizeStatsValuesProxy({ replace: true })
    );

    this.set(
      'completeLatestDirSizeStatsValuesUpdater',
      completeLatestDirSizeStatsValuesUpdater
    );
  },

  /**
   * @override
   */
  willDestroy() {
    try {
      this.completeLatestDirSizeStatsValuesUpdater?.destroy();
    } finally {
      this._super(...arguments);
    }
  },

  /**
   * @param {SpaceSizeStatsType} newTab
   * @returns {void}
   */
  changeTab(newTab) {
    this.set('activeTab', newTab);
  },

  /**
   * @override
   * @returns {Promise<SpaceCurrentSizeStats | { all: DirCurrentSizeStats }>}
   */
  async fetchCompleteLatestDirSizeStatsValues() {
    try {
      let result;
      if (this.isSpaceRootDir) {
        result = await this.fileManager.getSpaceCurrentSizeStats(
          get(this.space, 'entityId')
        );
      } else {
        result = {
          all: await this.fileManager.getDirCurrentSizeStats(get(this.file, 'entityId')),
        };
      }
      safeExec(this, () => this.set('dirStatsNotReady', false));
      return result;
    } catch (error) {
      const dirStatsNotReady = error?.id === 'dirStatsNotReady';
      safeExec(this, () => this.set('dirStatsNotReady', dirStatsNotReady));
      if (!dirStatsNotReady) {
        throw error;
      }
    }
  },

  /**
   * @param {string} providerId
   * @returns {Promise<TimeSeriesCollectionLayout>}
   */
  getDirSizeStatsTimeSeriesCollectionLayout(providerId) {
    if (this.isSpaceRootDir) {
      return this.fileManager.getSpaceSizeStatsTimeSeriesCollectionLayout(
        get(this.space, 'entityId'),
        providerId,
        this.activeTab
      );
    } else {
      return this.fileManager.getDirSizeStatsTimeSeriesCollectionLayout(
        get(this.file, 'entityId'),
        providerId
      );
    }
  },

  /**
   * @param {string} providerId
   * @param {TimeSeriesCollectionSliceQueryParams} queryParams
   * @returns {Promise<TimeSeriesCollectionSlice>}
   */
  getDirSizeStatsTimeSeriesCollectionSlice(providerId, queryParams) {
    if (this.isSpaceRootDir) {
      return this.fileManager.getSpaceSizeStatsTimeSeriesCollectionSlice(
        get(this.space, 'entityId'),
        providerId,
        this.activeTab,
        queryParams
      );
    } else {
      return this.fileManager.getDirSizeStatsTimeSeriesCollectionSlice(
        get(this.file, 'entityId'),
        providerId,
        queryParams
      );
    }
  },
});
