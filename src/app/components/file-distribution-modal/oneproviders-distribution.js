import Component from '@ember/component';
import { equal, raw, notEmpty } from 'ember-awesome-macros';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';

export default Component.extend({
  classNames: ['oneproviders-distribution'],

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
