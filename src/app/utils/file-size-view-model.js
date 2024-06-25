/**
 * Implements behavior and provides state of file size view (see set of
 * `file-size` components), that is typically rendered as a tab in file-info-modal.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed, observer, set } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { eq } from 'ember-awesome-macros';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { SpaceSizeStatsType } from 'oneprovider-gui/services/production/file-manager';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import Looper from 'onedata-gui-common/utils/looper';
import installGetByProperty from '../../lib/onedata-gui-common/addon/utils/install-get-by-property';

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
   * @type {boolean}
   */
  isActive: undefined,

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
   * @type {number}
   */
  latestDirSizeStatsUpdaterInterval: 5000,

  /**
   * @type {boolean}
   */
  dirStatsNotReady: false,

  /**
   * @type {Looper}
   */
  completeLatestDirSizeStatsValuesUpdater: undefined,

  /**
   * @type {ComputedProperty<string>}
   */
  fileId: reads('file.entityId'),

  /**
   * @type {ComputedProperty<string>}
   */
  spaceId: reads('space.entityId'),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isSpaceRootDir: eq('fileId', 'space.rootDir.entityId'),

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
  latestDirSizeStatsValues: undefined,

  /**
   * @type {ComputedProperty<{ [key in SpaceSizeStatsType]?: number }>}
   */
  completeTotalPhysicalSizes: computed(
    'completeLatestDirSizeStatsValues',
    function completeTotalPhysicalSizes() {
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
  totalPhysicalSize: undefined,

  isActiveObserver: observer('isActive', function isActiveObserver() {
    const newUpdateInterval = this.isActive ?
      this.latestDirSizeStatsUpdaterInterval : null;
    set(this.completeLatestDirSizeStatsValuesUpdater, 'interval', newUpdateInterval);
  }),

  /**
   * @override
   */
  init() {
    this._super(...arguments);

    installGetByProperty(
      this,
      'latestDirSizeStatsValues',
      'completeLatestDirSizeStatsValues',
      'activeTab',
    );

    installGetByProperty(
      this,
      'totalPhysicalSize',
      'completeTotalPhysicalSizes',
      'activeTab',
    );

    const completeLatestDirSizeStatsValuesUpdater = Looper.create({
      immediate: true,
      interval: null,
    });
    completeLatestDirSizeStatsValuesUpdater.on('tick', () =>
      this.updateCompleteLatestDirSizeStatsValuesProxy({ replace: true })
    );

    this.set(
      'completeLatestDirSizeStatsValuesUpdater',
      completeLatestDirSizeStatsValuesUpdater
    );
    this.isActiveObserver();
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
        result = await this.fileManager.getSpaceCurrentSizeStats(this.spaceId);
      } else {
        result = {
          all: await this.fileManager.getDirCurrentSizeStats(this.fileId),
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
        this.spaceId,
        providerId,
        this.activeTab
      );
    } else {
      return this.fileManager.getDirSizeStatsTimeSeriesCollectionLayout(
        this.fileId,
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
        this.spaceId,
        providerId,
        this.activeTab,
        queryParams
      );
    } else {
      return this.fileManager.getDirSizeStatsTimeSeriesCollectionSlice(
        this.fileId,
        providerId,
        queryParams
      );
    }
  },
});
