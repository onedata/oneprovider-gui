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
   * @type {Array<Models.File>}
   */
  files: undefined,
  
  /**
   * @type {Array<Models.File>}
   */
  fileDistributions: undefined,

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  hasSingleFile: equal('files.length', raw(1)),
});
