import Component from '@ember/component';
import { equal, raw } from 'ember-awesome-macros';

export default Component.extend({
  classNames: ['oneproviders-distribution'],

  /**
   * @virtual
   * @type {Array<Models.Provider>}
   */
  oneproviders: undefined,
  
  /**
   * @type {Array<Utils.FileDistributionDataContainer>}
   */
  fileDistributionData: undefined,

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  hasSingleFile: equal('fileDistributionData.length', raw(1)),
});
