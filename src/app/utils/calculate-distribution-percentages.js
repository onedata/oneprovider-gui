/**
 *
 * @author Agnieszka Raczek
 * @copyright (C) 2026 Onedata (onedata.org)
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed } from '@ember/object';
import computedSumBy from 'onedata-gui-common/utils/computed-sum-by';

export default EmberObject.extend({
  /**
   * @virtual
   * @type {Array<Utils.FileDistributionDataContainer>}
   */
  fileDistributionData: undefined,

  /**
   * @type {Ember.ComputedProperty<number>}
   */
  filesSize: computedSumBy('fileDistributionData', 'fileSize'),

  physicalSizePerStorageBackend: computed(
    'fileDistributionData',
    function physicalSizePerStorageBackend() {
      const result = {};
      for (const distributionItem of this.fileDistributionData) {
        for (const [providerId, data] of Object.entries(distributionItem.fileDistribution)) {
          if (!data.success) {
            result[providerId] = -1; // Indicate failure for this provider
          } else {
            if (!result[providerId]) {
              result[providerId] = {};
            }
            const distribution = data.distributionPerStorageBackend;
            for (const [storageId, distributionData] of Object.entries(distribution)) {
              if (!distributionData.success) {
                result[providerId][storageId] = -1; // Indicate failure for this storage backend
              } else {
                if (!result[providerId][storageId]) {
                  result[providerId][storageId] = distributionData.physicalSize;
                } else {
                  result[providerId][storageId] += distributionData.physicalSize;
                }
              }
            }
          }
        }
      }
      return result;
    }
  ),

  percentagePerStorageBackend: computed(
    'physicalSizePerStorageBackend',
    'filesSize',
    function percentagePerStorageBackend() {
      const result = {};
      for (const [providerId, data] of Object.entries(this.physicalSizePerStorageBackend)) {
        if (data === -1) {
          result[providerId] = -1; // Indicate failure for this provider
        } else {
          result[providerId] = {};
          for (const [storageId, distributionData] of Object.entries(data)) {
            if (distributionData === -1) {
              result[providerId][storageId] = -1; // Indicate failure for this storage backend
            } else {
              const physicalSize = distributionData;
              if (this.filesSize) {
                result[providerId][storageId] = (physicalSize / this.filesSize) * 100;
              } else if (this.filesSize === 0) {
                result[providerId][storageId] = 100;
              }
            }
          }
        }
      }
      return result;
    }
  ),

  roundedPercentagePerStorageBackend: computed(
    'percentagePerStorageBackend',
    function roundedPercentagePerStorageBackend() {
      const result = {};
      let totalPercentage = 0;
      for (const [providerId, data] of Object.entries(this.percentagePerStorageBackend)) {
        if (data === -1) {
          result[providerId] = -1; // Indicate failure for this provider
        } else {
          result[providerId] = {};
          for (const [storageId, percentage] of Object.entries(data)) {
            if (percentage === -1) {
              result[providerId][storageId] = -1; // Indicate failure for this storage backend
            } else {
              const roundedPercentage = percentage ?
                Math.max(Math.floor(percentage), 1) :
                0;
              result[providerId][storageId] = roundedPercentage;
              totalPercentage += roundedPercentage;
            }
          }
        }
      }

      if (totalPercentage > 100 || totalPercentage === 0) {
        return result;
      }

      // Adjust the percentages to ensure they sum up to 100
      let adjustment = 100 - totalPercentage;
      while (adjustment > 0) {
        let maxPercentage = -1;
        let maxProviderId = null;
        let maxStorageId = null;

        for (const [providerId, data] of Object.entries(this.percentagePerStorageBackend)) {
          if (data !== -1) {
            for (const [storageId, percentage] of Object.entries(data)) {
              if (percentage !== -1) {
                const fraction = percentage - Math.floor(percentage);
                if (fraction > maxPercentage && percentage > 1) {
                  maxPercentage = fraction;
                  maxProviderId = providerId;
                  maxStorageId = storageId;
                }
              }
            }
          }
        }
        if (maxProviderId === null || maxStorageId === null || maxPercentage <= 0) {
          break;
        }
        result[maxProviderId][maxStorageId] += 1;
        totalPercentage += 1;
        adjustment -= 1;
      }
      return result;
    }
  ),
});
