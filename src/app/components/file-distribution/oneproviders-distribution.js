/**
 * Shows distribution and transfer-related operations for each passed Oneprovider
 * in terms of selected files.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { observer, get, set, getProperties, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { conditional, raw, notEmpty, array, equal, promise } from 'ember-awesome-macros';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { Promise } from 'rsvp';
import I18n from 'onedata-gui-common/mixins/i18n';
import { inject as service } from '@ember/service';
import _ from 'lodash';
import sortByProperties from 'onedata-gui-common/utils/ember/sort-by-properties';
import { LegacyFileType } from 'onedata-gui-common/utils/file';

export default Component.extend(I18n, {
  classNames: ['oneproviders-distribution'],

  i18n: service(),
  storageManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileDistribution.oneprovidersDistribution',

  /**
   * Change of this property will enable/disable continuous fetching transfers
   * and data distribution
   * @virtual
   * @type {boolean}
   */
  visible: false,

  /**
   * If true, then distribution represents (or is used at least in) a view for
   * multiple selected files.
   * @virtual
   * @type {boolean}
   */
  batchMode: false,

  /**
   * @virtual
   * @type {Array<Models.Provider>}
   */
  oneproviders: undefined,

  /**
   * @virtual
   * @type {Array<Utils.FileDistributionDataContainer>}
   */
  fileDistributionData: undefined,

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  getProvidersUrl: notImplementedIgnore,

  /**
   * @type {PromiseObject}
   */
  initialRequiredDataProxy: promise.object(promise.all(
    'distributionItemsProxy',
    'storageLocationsProxy',
  )),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isSingleFile: equal('fileDistributionData.length', 1),

  /**
   * @type {ComputedProperty<Models.StorageLocationInfo>}
   */
  locationsPerProvider: computed(
    'fileDistributionData.firstObject.storageLocationsPerProvider',
    function locationsPerProvider() {
      const filesDistributionData = this.get('fileDistributionData');
      const fileDistributionData = get(filesDistributionData, 'firstObject');
      const fileType = get(fileDistributionData, 'fileType');
      if (filesDistributionData.length > 1 || fileType === 'dir') {
        return undefined;
      } else {
        return get(fileDistributionData, 'storageLocationsPerProvider');
      }
    }
  ),

  /**
   * @virtual
   * @type {Function}
   */
  getTransfersUrl: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   * @param {Models.Provider} destinationOneprovider
   * @returns {undefined}
   */
  onReplicate: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   * @param {Models.Provider} sourceOneprovider
   * @param {Models.Provider} destinationOneprovider
   * @returns {undefined}
   */
  onMigrate: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   * @param {Models.Provider} sourceOneprovider
   * @returns {undefined}
   */
  onEvict: notImplementedThrow,

  /**
   * Migration source Oneprovider used in destination-oneprovider-selector. Needed to
   * create new migration transfer.
   * @type {Models.Provider}
   */
  newMigrationSourceOneprovider: null,

  /**
   * If true, then Oneprovider under newMigrationSourceOneprovider has active transfers.
   * Used to show (or not) confirmation of creating subsequent transfer.
   * @type {boolean}
   */
  newMigrationSourceHasActiveTransfers: false,

  /**
   * @type {boolean}
   */
  isMigrationDestinationSelectorVisible: notEmpty('newMigrationSourceOneprovider'),

  /**
   * Type of transfer user want to create and which can result in starting a
   * subsequent transfer on some Oneprovider.
   * Possible values: replication, migration, eviction
   * @type {string|null}
   */
  startSubsequentTransferType: null,

  /**
   * Data needed by transfer user want to create and which can result in starting a
   * subsequent transfer on some Oneprovider.
   *
   * Format:
   * ```
   * {
   *   sourceOneprovider: Models.Provider|undefined,
   *   destinationOneprovider: Models.Provider|undefined,
   * }
   * ```
   * @type {Object}
   */
  startSubsequentTransferData: null,

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  isStartSubsequentTransferConfirmationVisible: notEmpty('startSubsequentTransferType'),

  /**
   * `resolve()` callback for the startTransferPromise Promise. Is not empty only
   * when startTransferPromise exists. Allows to fulfill startTransferPromise outside
   * Promise inner function scope.
   * @type {Function}
   * @returns {Promise}
   */
  startTransferPromiseResolveCallback: null,

  /**
   * Is null until user wants to start new transfer. In that case it becomes a Promise,
   * which resolves when the process of creating new transfers ends (either successfully
   * or by cancel). Allows to hide multistep logic of creating a transfer (asking
   * for creating possible subsequent transfer, selecting migration target, etc.) behind a
   * single Promise.
   */
  startTransferPromise: null,

  /**
   * Frame name, where Onezone space transfers link should be opened
   * @type {String}
   */
  navigateTransfersTarget: '_top',

  /**
   * @type {ComputedProperty<Array<Models.Provider>>}
   */
  oneprovidersSorted: array.sort('oneproviders', ['name']),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  isDistributionLoading: computed(
    'fileDistributionData.@each.isFileDistributionLoading',
    function isDistributionLoading() {
      return this.fileDistributionData?.some(data => data.isFileDistributionLoading);
    }
  ),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  distributionErrorReason: computed(
    'fileDistributionData.@each.fileDistributionErrorReason',
    function distributionErrorReason() {
      return this.get('fileDistributionData')
        .mapBy('fileDistributionErrorReason')
        .compact()
        .objectAt(0);
    }
  ),

  /**
   * A full URL for Onezone GUI window to show transfers for this distribution
   * @type {ComputedProperty<String>}
   */
  navigateTransfersHref: computed(
    function navigateTransfersHref() {
      const {
        fileDistributionData,
        getTransfersUrl,
      } = this.getProperties(
        'fileDistributionData',
        'getTransfersUrl',
      );
      return getTransfersUrl({
        fileId: get(fileDistributionData, 'firstObject.file.entityId'),
      });
    },
  ),

  /**
   * Only for the first file (non-batch mode)
   * @type {Ember.ComputedProperty<boolean>}
   */
  activeTransfersExist: conditional(
    'batchMode',
    raw(false),
    notEmpty('fileDistributionData.firstObject.activeTransfers')
  ),

  /**
   * Only for the first file (non-batch mode)
   * @type {Ember.ComputedProperty<number>}
   */
  endedTransfersCount: reads('fileDistributionData.firstObject.endedTransfersCount'),

  /**
   * Only for the first file (non-batch mode)
   * @type {Ember.ComputedProperty<boolean>}
   */
  endedTransfersOverflow: reads(
    'fileDistributionData.firstObject.endedTransfersOverflow'
  ),

  /**
   * @type {Ember.ComputedProperty<Array<Models.Provider>>}
   */
  evictingOneproviders: computed(
    'fileDistributionData.@each.activeTransfers',
    function evictingOneproviders() {
      return this.get('fileDistributionData')
        .mapBy('activeTransfers')
        .compact()
        .mapBy('evictingProvider')
        .compact();
    }
  ),

  visibleObserver: observer('visible', function visibleObserver() {
    const visible = this.get('visible');
    this.get('fileDistributionData').forEach(fileDistributionContainer => {
      if (get(fileDistributionContainer, 'keepDataUpdated') !== visible) {
        set(fileDistributionContainer, 'keepDataUpdated', visible);
      }
    });
  }),

  /**
   * @type {Object}
   */
  storageList: computed('fileDistributionData', 'oneproviders', function storageList() {
    const {
      fileDistributionData,
      oneproviders,
    } = this.getProperties('fileDistributionData', 'oneproviders');
    const storages = {};

    fileDistributionData.forEach(fileDistributionContainer => {
      oneproviders.forEach(oneprovider => {
        fileDistributionContainer.getStorageIdsForOneprovider(oneprovider).forEach(
          storage => {
            if (!(storage in storages)) {
              storages[storage] = oneprovider;
            }
          }
        );
      });
    });
    return storages;
  }),

  /**
   *
   * @type {ComputedProperty<PromiseArray<Object>>}
   */
  distributionItemsProxy: promise.array(
    computed(
      'fileDistributionData',
      'oneproviders',
      'storageManager',
      'space',
      function distributionItemsProxy() {
        const {
          fileDistributionData,
          oneproviders,
          storageManager,
          space,
        } = this.getProperties(
          'fileDistributionData',
          'oneproviders',
          'storageManager',
          'space'
        );
        const spaceId = get(space, 'entityId');

        return Promise.all(oneproviders.map(oneprovider => {
          return Promise.all(
            fileDistributionData[0].getStorageIdsForOneprovider(oneprovider).map(
              storageId => {
                return storageManager.getStorageById(storageId, {
                  throughSpaceId: spaceId,
                  backgroundReload: false,
                });
              }
            )
          ).then(storages => {
            return storages.map(storage => ({ storage, oneprovider }));
          });
        })).then(storagesPerOneprovider =>
          sortByProperties(_.flatten(storagesPerOneprovider), ['oneprovider.name'])
        );
      }
    )
  ),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  hasSingleRegFile: computed(
    'fileDistributionData.{length,0.fileType}',
    function hasSingleRegFile() {
      return this.fileDistributionData?.length === 1 &&
        this.fileDistributionData[0].fileType === LegacyFileType.File;
    }
  ),

  init() {
    this._super(...arguments);

    this.visibleObserver();
    this.set('shouldUpdate', true);
  },

  willDestroy() {
    try {
      this.fileDistributionData?.forEach(data => data.destroy());
    } finally {
      this._super(...arguments);
    }
  },

  /**
   * @param {Models.Provider} destinationOneprovider
   * @returns {Promise}
   */
  startReplication(destinationOneprovider) {
    return this.get('onReplicate')(destinationOneprovider)
      .finally(() => this.resolveStartTransferPromise());
  },

  /**
   * @param {Models.Provider} sourceOneprovider
   * @param {Models.Provider} destinationOneprovider
   * @returns {Promise}
   */
  startMigration(sourceOneprovider, destinationOneprovider) {
    return this.get('onMigrate')(sourceOneprovider, destinationOneprovider)
      .finally(() => this.resolveStartTransferPromise());
  },

  /**
   * @param {Models.Provider} sourceOneprovider
   * @returns {Promise}
   */
  startEviction(sourceOneprovider) {
    return this.get('onEvict')(sourceOneprovider)
      .finally(() => this.resolveStartTransferPromise());
  },

  /**
   * Creates new Promise, which will resolve when starting transfer will be done
   * (with success or not).
   * @returns {Promise}
   */
  newStartTransferPromise() {
    const promise = new Promise(resolve => {
      this.set('startTransferPromiseResolveCallback', resolve);
    });
    this.set('startTransferPromise', promise);
    return promise;
  },

  /**
   * Resolves promise previously created in `newStartTransferPromise` method.
   * @returns {undefined}
   */
  resolveStartTransferPromise() {
    const startTransferPromiseResolveCallback =
      this.get('startTransferPromiseResolveCallback');
    if (startTransferPromiseResolveCallback) {
      safeExec(this, () => this.setProperties({
        startTransferPromise: null,
        startTransferPromiseResolveCallback: null,
      }));
      startTransferPromiseResolveCallback();
    }
  },

  actions: {
    tryStartReplication(destinationOneprovider, hasActiveTransfers) {
      if (hasActiveTransfers) {
        this.setProperties({
          startSubsequentTransferType: 'replication',
          startSubsequentTransferData: {
            destinationOneprovider,
          },
        });
        return this.newStartTransferPromise();
      } else {
        return this.startReplication(destinationOneprovider);
      }
    },
    selectMigrationDestination(sourceOneprovider, hasActiveTransfers) {
      this.setProperties({
        newMigrationSourceOneprovider: sourceOneprovider,
        newMigrationSourceHasActiveTransfers: hasActiveTransfers,
      });
      return this.newStartTransferPromise();
    },
    tryStartMigration(destinationOneprovider) {
      const {
        newMigrationSourceOneprovider,
        newMigrationSourceHasActiveTransfers,
        startTransferPromise,
      } = this.getProperties(
        'newMigrationSourceOneprovider',
        'newMigrationSourceHasActiveTransfers',
        'startTransferPromise'
      );
      this.setProperties({
        newMigrationSourceOneprovider: null,
        newMigrationSourceHasActiveTransfers: false,
      });

      if (newMigrationSourceHasActiveTransfers) {
        this.setProperties({
          startSubsequentTransferType: 'migration',
          startSubsequentTransferData: {
            sourceOneprovider: newMigrationSourceOneprovider,
            destinationOneprovider,
          },
        });
        return startTransferPromise;
      } else {
        return this.startMigration(
          newMigrationSourceOneprovider,
          destinationOneprovider
        );
      }
    },
    tryStartEviction(sourceOneprovider, hasActiveTransfers) {
      if (hasActiveTransfers) {
        this.setProperties({
          startSubsequentTransferType: 'eviction',
          startSubsequentTransferData: {
            sourceOneprovider,
          },
        });
        return this.newStartTransferPromise();
      } else {
        return this.startEviction(sourceOneprovider);
      }
    },
    startSubsequentTransfer() {
      const {
        startSubsequentTransferType,
        startSubsequentTransferData,
      } = this.getProperties(
        'startSubsequentTransferType',
        'startSubsequentTransferData'
      );
      const {
        sourceOneprovider,
        destinationOneprovider,
      } = getProperties(
        startSubsequentTransferData,
        'sourceOneprovider',
        'destinationOneprovider'
      );

      let promise;
      switch (startSubsequentTransferType) {
        case 'replication':
          promise = this.startReplication(destinationOneprovider);
          break;
        case 'migration':
          promise = this.startMigration(sourceOneprovider, destinationOneprovider);
          break;
        case 'eviction':
          promise = this.startEviction(sourceOneprovider);
          break;
      }
      return promise.finally(() => safeExec(this, () => {
        this.setProperties({
          startSubsequentTransferType: null,
          startSubsequentTransferData: null,
        });
      }));
    },
    cancelSubsequentTransfer() {
      this.setProperties({
        startSubsequentTransferType: null,
        startSubsequentTransferData: null,
      });
      this.resolveStartTransferPromise();
    },
    cancelNewMigration() {
      this.setProperties({
        newMigrationSourceOneprovider: null,
        newMigrationSourceHasActiveTransfers: false,
      });
      this.resolveStartTransferPromise();
    },
    getProvidersUrl(...args) {
      return this.get('getProvidersUrl')(...args);
    },
  },
});
