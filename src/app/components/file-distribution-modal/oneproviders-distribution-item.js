import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { sum, array, equal, raw } from 'ember-awesome-macros';

export default Component.extend({
  tagName: 'li',
  classNames: ['oneproviders-distribution-item'],

  /**
   * @virtual
   * @type {Models.Provider}
   */
  oneprovider: undefined,

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

  /**
   * @type {Ember.ComputedProperty<number>}
   */
  filesSize: sum(array.mapBy('files', raw('size'))),

  /**
   * @type {Ember.ComputedProperty<number>}
   */
  percentage: computed(
    'filesSize',
    'files.@each.size',
    'fileDistributions.@each.blocksPercentage',
    function () {
      const {
        filesSize,
        files,
        fileDistributions,
      } = this.getProperties('filesSize', 'files', 'fileDistributions');

      let availableBytes = 0;
      files.forEach((file, index) => {
        availableBytes += get(file, 'size') *
          ((get(fileDistributions[index], 'blocksPercentage') || 0) / 100);
      });

      return Math.floor((availableBytes / filesSize) * 100);
    }
  ),

  /**
   * @type {Ember.ComputedProperty<Object>}
   */
  chunksBarData: computed(
    'percentage',
    'fileDistributions.@each.{chunksBarData}',
    function chunksBarData() {
      const {
        fileDistributions,
        percentage,
      } = this.getProperties('fileDistributions', 'percentage');

      if (get(fileDistributions, 'length') === 1) {
        return get(fileDistributions[0], 'chunksBarData');
      } else {
        if (percentage) {
          return {
            0: 100,
            [Math.floor(percentage * 320 / 100)]: 0,
          };
        } else {
          return {
            0: 0,
          };
        }
      }
    }
  ),
});
