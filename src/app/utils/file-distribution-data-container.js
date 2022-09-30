/**
 * Class that allows to retrieve distribution-related data for specified file including
 * distribution per Oneprovider and active transfers.
 *
 * @module utils/file-distribution-data-container
 * @author Michał Borzęcki
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { get, set, setProperties, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { resolve, Promise, reject } from 'rsvp';
import { conditional, raw, gt, and, not, notEmpty, eq } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import Looper from 'onedata-gui-common/utils/looper';
import { computed } from '@ember/object';

export default EmberObject.extend(
  createDataProxyMixin('fileDistributionModel'),
  createDataProxyMixin('transfers'),
  createDataProxyMixin('storageLocations'), {
    transferManager: service(),
    onedataConnection: service(),

    /**
     * If set to true, transfers and data distribution will be updated periodically
     * @virtual
     * @type {boolean}
     */
    keepDataUpdated: true,

    /**
     * @virtual
     * @type {Models.File}
     */
    file: undefined,

    /**
     * Initialized in `init()`
     * @type {Looper}
     */
    dataUpdater: undefined,

    fileDistributionCache: undefined,

    storageLocationsPerProviderCache: undefined,

    /**
     * @type {number}
     */
    slowPollingTime: 10 * 1000,

    /**
     * @type {number}
     */
    fastPollingTime: 4 * 1000,

    /**
     * If true, then file distribution and transfers data should be updated more
     * frequently (due to working transfers on backend).
     * @type {Ember.ComputedProperty<boolean>}
     */
    fastDataUpdateEnabled: gt('activeTransfers.length', raw(0)),

    /**
     * @type {Ember.ComputedProperty<number>}
     */
    pollingTime: conditional(
      'keepDataUpdated',
      conditional(
        'fastDataUpdateEnabled',
        'fastPollingTime',
        'slowPollingTime'
      ),
      raw(-1)
    ),

    /**
     * @type {Ember.ComputedProperty<string>}
     */
    fileType: reads('file.type'),

    /**
     * File size. If file is a directory and statistics are turned off, then size is null.
     * @type {Ember.ComputedProperty<number>}
     */
    fileSize: computed('fileDistribution', function fileSize() {
      const fileDistribution = this.get('fileDistribution');
      let fileSizeMax = 0;
      for (const elem in fileDistribution) {
        const logicalSize = get(fileDistribution[elem], 'logicalSize');
        if (logicalSize) {
          fileSizeMax = Math.max(fileSizeMax, logicalSize);
        }
      }
      return fileSizeMax;
    }),

    /**
     * @type {Ember.ComputedProperty<boolean>}
     */
    isFileDistributionLoaded: notEmpty('fileDistributionModelProxy.content'),

    /**
     * @type {Ember.ComputedProperty<boolean>}
     */
    isFileDistributionLoading: and(
      'fileDistributionModelProxy.isPending',
      not('isFileDistributionLoaded')
    ),

    /**
     * @type {Ember.ComputedProperty<boolean>}
     */
    isFileDistributionError: reads('fileDistributionModelProxy.isRejected'),

    /**
     * @type {Ember.ComputedProperty<any>}
     */
    fileDistributionErrorReason: reads('fileDistributionModelProxy.reason'),

    /**
     * Mapping { oneproviderId -> distribution }. Not empty only if file
     * distribution has been successfully loaded. Is empty for directories.
     * @type {Ember.ComputedProperty<OneproviderDistribution>}
     */
    fileDistribution: reads('fileDistributionModel.distributionPerProvider'),

    /**
     * @type {ComputedProperty<LocationsPerProvider>}
     */
    storageLocationsPerProvider: conditional(
      eq('fileType', raw('dir')),
      null,
      'storageLocations.locationsPerProvider'
    ),

    /**
     * @type {Ember.ComputedProperty<Array<Models.Transfer>>}
     */
    activeTransfers: reads('transfers.ongoingTransfers'),

    /**
     * @type {Ember.ComputedProperty<number>}
     */
    endedTransfersCount: reads('transfers.endedCount'),

    /**
     * True if real number of ended transfers for file could overflow the limit
     * (see `fetchTransfers` method).
     * @type {Ember.ComputedProperty<boolean>}
     */
    endedTransfersOverflow: reads('transfers.endedOverflow'),

    /**
     * If true, storage locations will be reloaded
     * @type {Boolean}
     */
    isStorageLocationsUpdated: false,

    pollingTimeObserver: observer('pollingTime', function pollingTimeObserver() {
      const {
        dataUpdater,
        pollingTime,
      } = this.getProperties(
        'dataUpdater',
        'pollingTime'
      );

      if (get(dataUpdater, 'interval') !== pollingTime) {
        setProperties(dataUpdater, {
          interval: pollingTime,
          immediate: true,
        });
      }
    }),

    storageLocationsUpdateSetuper: observer(
      'pollingTime',
      'storageLocationsPerProvider',
      'fileDistribution',
      async function storageLocationsUpdateSetuper() {
        const {
          fileDistribution,
          fileDistributionCache,
          storageLocationsPerProviderCache,
          storageLocationsPerProvider,
        } = this.getProperties(
          'fileDistributionCache',
          'storageLocationsPerProviderCache',
          'fileDistribution',
          'storageLocationsPerProvider',
        );
        if (this.get('fileType') === 'dir' || fileDistribution?.length === 1) {
          this.set('isStorageLocationsUpdated', false);
          return;
        }

        let isStorageLocationsUpdatedChanged = false;
        if (fileDistributionCache) {
          for (const providerId in fileDistribution) {
            const distributionPerStorages =
              fileDistribution[providerId].distributionPerStorage;
            const distributionPerStoragesPast =
              fileDistributionCache[providerId].distributionPerStorage;
            for (const storageId in distributionPerStorages) {
              if (
                distributionPerStoragesPast[storageId].blocksPercentage === 0 &&
                distributionPerStorages[storageId].blocksPercentage !== 0
              ) {
                this.set('isStorageLocationsUpdated', true);
                isStorageLocationsUpdatedChanged = true;
              }
            }
          }
        }
        if (!isStorageLocationsUpdatedChanged && storageLocationsPerProviderCache) {
          for (const providerId in storageLocationsPerProvider) {
            const locationsPerStorage =
              storageLocationsPerProvider[providerId].locationsPerStorage;
            const locationsPerStoragePast =
              storageLocationsPerProviderCache[providerId].locationsPerStorage;
            for (const storageId in locationsPerStorage) {
              if (
                locationsPerStorage[storageId] !==
                locationsPerStoragePast[storageId]
              ) {
                this.set('isStorageLocationsUpdated', false);
              }
            }
          }
        }
        this.setProperties({
          fileDistributionCache: fileDistribution,
          storageLocationsPerProviderCache: storageLocationsPerProvider,
        });
      }
    ),

    init() {
      this._super(...arguments);

      const dataUpdater = Looper.create({
        interval: this.get('pollingTime'),
      });
      dataUpdater.on('tick', () => this.updateData());
      this.set('dataUpdater', dataUpdater);
      this.storageLocationsUpdateSetuper();
    },

    willDestroy() {
      try {
        this.get('dataUpdater').destroy();
      } finally {
        this._super(...arguments);
      }
    },

    /**
     * @override
     */
    fetchFileDistributionModel() {
      const file = this.get('file');
      const distributionLoadError = get(file, 'distributionLoadError');

      if (distributionLoadError) {
        // If earlier fetching of distribution ended with error, then just
        // rethrow it. We can't try to reload distribution model because
        // rejected belongsTo relation cannot be reloaded (a bug in Ember).
        return reject(distributionLoadError);
      } else {
        return file.belongsTo('distribution').reload()
          .catch(reloadError => {
            set(file, 'distributionLoadError', reloadError);
            throw reloadError;
          });
      }
    },

    /**
     * Returns Promise, which resolves to object:
     * ```
     * {
     *   ongoingTransfers: Array<Models.Transfer>,
     *   endedCount: number,
     *   endedOverflow: boolean, // true if ended transfers number is
     *     greater than or equal to backend listing limit
     * }
     * ```
     *
     * @override
     */
    fetchTransfers() {
      const {
        file,
        transferManager,
        onedataConnection,
      } = this.getProperties(
        'file',
        'transferManager',
        'onedataConnection'
      );
      const transfersHistoryLimitPerFile =
        get(onedataConnection, 'transfersHistoryLimitPerFile');

      return transferManager.getTransfersForFile(file).then(({
        ongoingTransfers,
        endedCount,
      }) => ({
        ongoingTransfers,
        endedCount,
        endedOverflow: endedCount >= transfersHistoryLimitPerFile,
      }));
    },

    fetchStorageLocations() {
      const file = this.get('file');
      return file.belongsTo('storageLocationInfo').reload();
    },

    /**
     * @returns {Promise}
     */
    async updateData() {
      const {
        isStorageLocationsUpdated: firstIsStorageLocationsUpdated,
        isFileDistributionError,
        transfersProxy,
      } = this.getProperties(
        'isStorageLocationsUpdated',
        'isFileDistributionError',
        'transfersProxy'
      );
      await Promise.all([
        !isFileDistributionError ?
        this.updateFileDistributionModelProxy({ replace: true }) : resolve(),
        !get(transfersProxy, 'isRejected') ?
        this.updateTransfersProxy({ replace: true }) : resolve(),
        firstIsStorageLocationsUpdated ?
        this.updateStorageLocationsProxy({ replace: true }) : resolve(),
      ]);
      // getting current value of isStorageLocationsUpdated, because it might be updated
      // after async call
      if (!firstIsStorageLocationsUpdated && this.isStorageLocationsUpdated) {
        await this.updateStorageLocationsProxy({ replace: true });
        // this.storageLocationsUpdateSetuper();
      }
    },

    /**
     * Returns distribution information for given Oneprovider
     * @param {Models.Provider} oneprovider
     * @returns {OneproviderDistribution}
     */
    getDistributionForOneprovider(oneprovider) {
      const {
        isFileDistributionLoaded,
        fileDistribution,
      } = this.getProperties('isFileDistributionLoaded', 'fileDistribution');
      if (isFileDistributionLoaded) {
        const oneproviderEntityId = get(oneprovider, 'entityId');
        return get(fileDistribution, oneproviderEntityId);
      } else {
        return {};
      }
    },

    /**
     * Returns list of storage ids for given Oneprovider
     * @param {Models.Provider} oneprovider
     * @returns {Array<String>}
     */
    getStorageIdsForOneprovider(oneprovider) {
      if (this.isFileDistributionLoaded) {
        const oneproviderData = this.getDistributionForOneprovider(oneprovider);
        return Object.keys(get(oneproviderData, 'distributionPerStorage'));
      } else {
        return [];
      }
    },

    /**
     * Returns distribution information for given Storage id on given Oneprovider
     * @param {Models.Provider} oneprovider
     * @param {String} storageId
     * @returns {StorageDistribution}
     */
    getDistributionForStorageId(oneprovider, storageId) {
      const distributionForProvider = this.getDistributionForOneprovider(oneprovider);
      if (get(distributionForProvider, 'success')) {
        const storageIdsForProvider = get(
          distributionForProvider, 'distributionPerStorage'
        );
        return get(storageIdsForProvider, storageId);
      } else {
        return {};
      }
    },
  }
);
