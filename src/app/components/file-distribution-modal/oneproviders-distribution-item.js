import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { sum, array, equal, raw } from 'ember-awesome-macros';

export default Component.extend({
  tagName: 'li',
  classNames: ['oneproviders-distribution-item'],

  /**
   * @virtual
   * @type {Models.Provider}
   */
  oneprovider: undefined,

  oneproviderEntityId: reads('oneprovider.entityId'),
  
  /**
   * @type {Array<Models.File>}
   */
  fileDistributionData: undefined,

  hasAllFilesDistributions: array.isEvery(
    'fileDistributionData',
    raw('fileDistributionModelProxy.isFulfilled')
  ),

  neverSynchronized: computed(
    'fileDistributionData.@each.fileDistribution',
    'oneprovider',
    function neverSynchronized() {
      const {
        fileDistributionData,
        oneprovider,
      } = this.getProperties('fileDistributionData', 'oneprovider');
      return fileDistributionData
        .map(fileDistDataContainer =>
          fileDistDataContainer.getDistributionForOneprovider(oneprovider)
        ).isEvery('neverSynchronized');
    }
  ),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  hasSingleFile: equal('files.length', raw(1)),

  /**
   * @type {Ember.ComputedProperty<number>}
   */
  filesSize: sum(array.mapBy('fileDistributionData', raw('fileSize'))),

  /**
   * @type {Ember.ComputedProperty<number>}
   */
  percentage: computed(
    'hasAllFilesDistributions',
    'filesSize',
    'fileDistributionData.@each.{fileSize,fileDistribution}',
    'oneprovider',
    function () {
      const {
        filesSize,
        fileDistributionData,
        hasAllFilesDistributions,
        oneprovider,
      } = this.getProperties(
        'filesSize',
        'fileDistributionData',
        'hasAllFilesDistributions',
        'oneprovider'
      );

      if (hasAllFilesDistributions) {
        // check filesSize to not divide by 0 (in return statement)
        if (filesSize) {
          let availableBytes = 0;
          fileDistributionData.forEach(fileDistDataContainer => {
            const fileSize = get(fileDistDataContainer, 'fileSize');
            const fileDistribution =
              fileDistDataContainer.getDistributionForOneprovider(oneprovider);
            const blocksPercentage = get(fileDistribution, 'blocksPercentage');
            availableBytes += fileSize * ((blocksPercentage || 0) / 100);
          });
    
          return Math.floor(
            (Math.min(availableBytes, filesSize) / filesSize) * 100
          );
        } else {
          return 100;
        }
      } else {
        return 0;
      }
    }
  ),

  /**
   * @type {Ember.ComputedProperty<Object>}
   */
  chunksBarData: computed(
    'hasAllFilesDistributions',
    'filesSize',
    'fileDistributionData.@each.{fileSize,fileDistribution}',
    'hasSingleFile',
    'oneprovider',
    function chunksBarData() {
      const {
        fileDistributionData,
        filesSize,
        hasAllFilesDistributions,
        hasSingleFile,
        oneprovider,
      } = this.getProperties(
        'fileDistributionData',
        'filesSize',
        'hasAllFilesDistributions',
        'hasSingleFile',
        'oneprovider'
      );

      if (!hasAllFilesDistributions || !filesSize) {
        return { 0: 0 };
      } else if (hasSingleFile) {
        const fileDistribution =
          fileDistributionData[0].getDistributionForOneprovider(oneprovider);
        return get(fileDistribution, 'chunksBarData');
      } else {
        const chunks = {};
        let chunksOffset = 0;
        fileDistributionData.forEach(fileDistDataContainer => {
          const fileSize = get(fileDistDataContainer, 'fileSize');
          if (fileSize) {
            const fileShare = fileSize / filesSize;
            const fileDistribution =
              fileDistDataContainer.getDistributionForOneprovider(oneprovider);
            const chunksBarData = get(fileDistribution, 'chunksBarData');
            if (chunksBarData) {
              Object.keys(chunksBarData).forEach(key => {
                chunks[Number(key) * fileShare + chunksOffset] = get(chunksBarData, key);
              });
            }
            chunksOffset += fileShare * 320;
          }
        });
        return chunks;
      }
    }
  ),
});
