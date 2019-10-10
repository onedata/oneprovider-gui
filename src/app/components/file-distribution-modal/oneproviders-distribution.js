/**
 * Shows distribution and transfer-related operations for each passed Oneprovider
 * in terms of selected files.
 * 
 * @module components/file-distribution-modal/oneproviders-distribution
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { observer, get, set, getProperties, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { conditional, raw, notEmpty, array } from 'ember-awesome-macros';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { Promise } from 'rsvp';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  classNames: ['oneproviders-distribution'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileDistributionModal.oneprovidersDistribution',

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
   * @type {Function}
   * @param {Models.Provider} destinationOneprovider
   * @returns {undefined}
   */
  onReplicate: notImplementedThrow,

  /**
   * @type {Function}
   * @param {Models.Provider} sourceOneprovider
   * @param {Models.Provider} destinationOneprovider
   * @returns {undefined}
   */
  onMigrate: notImplementedThrow,

  /**
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
   * @type {Ember.ComputedProperty<boolean>}
   */
  isDistributionLoading: array.isAny(
    'fileDistributionData',
    'isFileDistributionLoading'
  ),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  isDistributionLoaded: computed(
    'fileDistributionData.@each.fileDistribution',
    function isDistributionLoaded() {
      const {
        fileDistributionData,
        isDistributionError,
      } = this.getProperties('fileDistributionData', 'isDistributionError');

      return !isDistributionError && fileDistributionData
        .filterBy('fileType', 'file')
        .mapBy('fileDistribution')
        .every(value => value);
    }
  ),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  isDistributionError: array.isAny(
    'fileDistributionData',
    raw('isFileDistributionError')
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
  endedTransfersOverflow: reads('fileDistributionData.firstObject.endedTransfersOverflow'),

  /**
   * @type {Ember.ComputedProperty<Array<Models.Provider>>}
   */
  disabledMigrationTargets: computed(
    'fileDistributionData.@each.activeTransfers',
    function disabledMigrationTargets() {
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

  init() {
    this._super(...arguments);

    this.visibleObserver();
  },

  willDestroyElement() {
    try {
      this.get('fileDistributionData').setEach('keepDataUpdated', false);
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
    const startTransferPromiseResolveCallback = this.get('startTransferPromiseResolveCallback');
    if (startTransferPromiseResolveCallback) {
      safeExec(this, () => this.setProperties({
        startTransferPromise: null,
        startTransferPromiseResolveCallback: null,
      }));
      startTransferPromiseResolveCallback();
    }
  },

  actions: {
    checkForStartingSubsequentReplication(destinationOneprovider, hasActiveTransfers) {
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
    checkForStartingSubsequentMigration(destinationOneprovider) {
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
        return this.startMigration(newMigrationSourceOneprovider, destinationOneprovider);
      }
    },
    checkForStartingSubsequentEviction(sourceOneprovider, hasActiveTransfers) {
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
    navigateToTransfers(/* file */) {
      // FIXME: implement
    },
  },
});
