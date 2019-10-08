import Component from '@ember/component';
import { observer, getProperties, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { conditional, raw, notEmpty, array } from 'ember-awesome-macros';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { Promise, resolve } from 'rsvp';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['oneproviders-distribution'],

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
   * @param {Models.Oneprovider} destinationOneprovider
   * @returns {undefined}
   */
  onReplicate: notImplementedThrow,

  /**
   * @type {Function}
   * @param {Models.Oneprovider} sourceOneprovider
   * @param {Models.Oneprovider} destinationOneprovider
   * @returns {undefined}
   */
  onMigrate: notImplementedThrow,

  /**
   * @type {Function}
   * @param {Models.Oneprovider} sourceOneprovider
   * @returns {undefined}
   */
  onEvict: notImplementedThrow,

  /**
   * @type {Models.Oneprovider}
   */
  newMigrationSourceOneprovider: null,

  /**
   * @type {boolean}
   */
  newMigrationSourceHasActiveTransfers: false,

  /**
   * @type {boolean}
   */
  isMigrationDestinationSelectorVisible: notEmpty('newMigrationSourceOneprovider'),

  /**
   * @type {string}
   */
  startSubsequentTransferType: null,

  /**
   * ```
   * {
   *   sourceOneprovider: Models.Oneprovider|undefined,
   *   destinationOneprovider: Models.Oneprovider|undefined,
   * }
   * ```
   * @type {Object}
   */
  startSubsequentTransferData: null,

  /**
   * @type {boolean}
   */
  isStartSubsequentTransferConfirmationVisible: notEmpty('startSubsequentTransferType'),


  /**
   * `resolve()` callback for the promise binded to migration action. Should be
   * eventually called either with no arguments (when choosing target
   * oneprovider was cancelled) or with result promise of migration.
   * @type {Function}
   * @returns {Promise}
   */
  startTransferPromiseResolveCallback: notImplementedIgnore,

  isDistributionLoading: array.isAny('fileDistributionData', 'isFileDistributionLoading'),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  isDistributionLoaded: computed('fileDistributionData.@each.fileDistribution', function isDistributionLoaded() {
    const {
      fileDistributionData,
      isDistributionError,
    } = this.getProperties('fileDistributionData', 'isDistributionError');

    return !isDistributionError && fileDistributionData
      .filterBy('fileType', 'file')
      .mapBy('fileDistribution')
      .every(value => value);
  }),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  isDistributionError: array.isAny('fileDistributionData', raw('isFileDistributionError')),
  
  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  distributionErrorReason: computed('fileDistributionData.@each.fileDistributionErrorReason', function distributionErrorReason() {
    return this.get('fileDistributionData').mapBy('fileDistributionErrorReason').compact().objectAt(0);
  }),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  activeTransfersExist: conditional(
    'batchMode',
    raw(false),
    notEmpty('fileDistributionData.firstObject.activeTransfers')
  ),

  /**
   * @type {Ember.ComputedProperty<number>}
   */
  endedTransfersCount: reads('fileDistributionData.firstObject.endedTransfersCount'),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  endedTransfersOverflow: reads('fileDistributionData.firstObject.endedTransfersOverflow'),

  /**
   * @type {Ember.ComputedProperty<Array<Models.Oneprovider>>}
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
    this.get('fileDistributionData').setEach(
      'keepDataUpdated',
      this.get('visible')
    );
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

  startReplication(destinationOneprovider) {
    return this.get('onReplicate')(destinationOneprovider)
      .finally(() => this.resolveStartTransferPromise());
  },

  startMigration(sourceOneprovider, destinationOneprovider) {
    return this.get('onMigrate')(sourceOneprovider, destinationOneprovider)
      .finally(() => this.resolveStartTransferPromise());
  },

  startEviction(sourceOneprovider) {
    return this.get('onEvict')(sourceOneprovider)
      .finally(() => this.resolveStartTransferPromise());
  },

  newStartTransferPromise() {
    const promise = new Promise(resolve => {
      this.set('startTransferPromiseResolveCallback', resolve);
    });
    this.set('startTransferPromise', promise);
    return promise;
  },

  resolveStartTransferPromise() {
    const startTransferPromiseResolveCallback = this.get('startTransferPromiseResolveCallback');
    if (startTransferPromiseResolveCallback) {
      safeExec(this, () => this.set('startTransferPromiseResolveCallback', null));
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
      } = this.getProperties(
        'newMigrationSourceOneprovider',
        'newMigrationSourceHasActiveTransfers',
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
        // Resolve immediately because transfer is not created now
        return resolve();
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
