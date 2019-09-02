import Component from '@ember/component';
import { equal, raw } from 'ember-awesome-macros';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';

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
   * @returns {undefined}
   */
  onMigrate: notImplementedThrow,

  /**
   * @type {Function}
   * @param {Models.Oneprovider} sourceOneprovider
   * @returns {undefined}
   */
  onInvalidate: notImplementedThrow,

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  hasSingleFile: equal('fileDistributionData.length', raw(1)),
});
