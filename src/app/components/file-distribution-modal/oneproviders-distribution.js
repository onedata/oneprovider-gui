import Component from '@ember/component';
import { observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import { conditional, raw, notEmpty } from 'ember-awesome-macros';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { Promise } from 'rsvp';
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
  isVisible: false,

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
  isMigrationDestinationSelectorVisible: notEmpty('newMigrationSourceOneprovider'),

  /**
   * `resolve()` callback for the promise binded to migration action. Should be
   * eventually called either with no arguments (when choosing target
   * oneprovider was cancelled) or with result promise of migration.
   * @type {Function}
   * @returns {Promise}
   */
  migrationPromiseResolveCallback: notImplementedIgnore,

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

  isVisibleObserver: observer('isVisible', function isVisibleObserver() {
    this.get('fileDistributionData').setEach(
      'keepDataUpdated',
      this.get('isVisible')
    );
  }),

  init() {
    this._super(...arguments);

    this.isVisibleObserver();
  },

  willDestroyElement() {
    try {
      this.get('fileDistributionData').setEach('keepDataUpdated', false);
    } finally {
      this._super(...arguments);
    }
  },

  actions: {
    initializeNewMigration(sourceOneprovider) {
      this.set('newMigrationSourceOneprovider', sourceOneprovider);
      return new Promise(resolve => {
        // Persist resolve function to call it when starting migration procedure
        // will finish
        this.set('migrationPromiseResolveCallback', resolve);
      });
    },
    migrate(destinationOneprovider) {
      const {
        migrationPromiseResolveCallback,
        onMigrate,
        newMigrationSourceOneprovider,
      } = this.getProperties(
        'migrationPromiseResolveCallback',
        'onMigrate',
        'newMigrationSourceOneprovider'
      );
      return migrationPromiseResolveCallback(
        onMigrate(
          newMigrationSourceOneprovider,
          destinationOneprovider
        ).then(() =>
          safeExec(this, () => this.set('newMigrationSourceOneprovider', null))
        ).finally(() => {
          safeExec(this, () => this.set('migrationPromiseResolveCallback', notImplementedIgnore));
        }
      ));
    },
    cancelNewMigration() {
      const migrationPromiseResolveCallback = this.get('migrationPromiseResolveCallback');
      this.setProperties({
        newMigrationSourceOneprovider: null,
        migrationPromiseResolveCallback: notImplementedIgnore,
      });
      return migrationPromiseResolveCallback();
    },
    navigateToTransfers(/* file */) {
      // FIXME: implement
    },
  },
});
