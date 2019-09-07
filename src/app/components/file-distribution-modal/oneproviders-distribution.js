import Component from '@ember/component';
import { observer } from '@ember/object';
import { equal, raw, notEmpty } from 'ember-awesome-macros';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';

export default Component.extend({
  classNames: ['oneproviders-distribution'],

  /**
   * Change of this property will enable/disable continuous fetching transfers
   * and data distribution
   * @virtual
   * @type {boolean}
   */
  isVisible: false,

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
   * @type {Ember.ComputedProperty<boolean>}
   */
  hasSingleFile: equal('fileDistributionData.length', raw(1)),

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
    },
    migrate(destinationOneprovider) {
      return this.get('onMigrate')(
        this.get('newMigrationSourceOneprovider'),
        destinationOneprovider
      ).then(() => safeExec(this, () => this.set('newMigrationSourceOneprovider', null)));
    },
    cancelNewMigration() {
      this.set('newMigrationSourceOneprovider', null);
    },
  },
});
