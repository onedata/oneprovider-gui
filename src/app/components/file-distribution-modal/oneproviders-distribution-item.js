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
    'filesSize',
    'files.@each.size',
    'fileDistributions.@each.{chunksBarData}',
    function chunksBarData() {
      const {
        fileDistributions,
        filesSize,
        files,
      } = this.getProperties('fileDistributions', 'filesSize', 'files');

      if (get(fileDistributions, 'length') === 1) {
        return get(fileDistributions[0], 'chunksBarData');
      } else if (filesSize === 0) {
        return { 0: 0 };
      } else {
        const chunksBarData = {};
        let chunksOffset = 0;
        files.forEach((file, index) => {
          const fileSize = get(file, 'size');
          if (fileSize) {
            const fileShare = fileSize / filesSize;
            const fileChunks = get(fileDistributions[index], 'chunksBarData');

            Object.keys(fileChunks).forEach(key => {
              chunksBarData[Number(key) * fileShare + chunksOffset] = get(fileChunks, key);
            });

            chunksOffset += fileShare * 320;
          }
        });
        return chunksBarData;
      }
    }
  ),
});
