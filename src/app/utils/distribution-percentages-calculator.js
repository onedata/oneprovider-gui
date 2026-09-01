/**
 * Calculates the distribution of files across providers and their storage
 * backends. It computes physical sizes and percentages, then rounds the
 * percentages so that, whenever possible, they add up to 100%. Non-zero
 * percentages smaller than 1% are raised to 1% to ensure that small
 * distributions remain visible.
 *
 * @author Agnieszka Raczek
 * @copyright (C) 2026 Onedata (onedata.org)
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed } from '@ember/object';
import computedSumBy from 'onedata-gui-common/utils/computed-sum-by';

export const providerDistributionFailure = -1;

export default EmberObject.extend({
  /**
   * @virtual
   * @type {Array<Utils.FileDistributionDataContainer>}
   */
  distributionContainer: undefined,

  /**
   * @type {Ember.ComputedProperty<number>}
   */
  filesSize: computedSumBy('distributionContainer', 'fileSize'),

  physicalSizePerStorageBackend: computed(
    'distributionContainer',
    'filesSize',
    function physicalSizePerStorageBackend() {
      if (this.filesSize === 0) {
        return {};
      }
      const result = {};
      for (const distributionItem of this.distributionContainer) {
        for (
          const [
            providerId,
            oneproviderDistribution,
          ] of Object.entries(distributionItem.fileDistribution)
        ) {
          if (!oneproviderDistribution.success) {
            // Indicate failure for this provider
            result[providerId] = providerDistributionFailure;
          } else {
            if (!result[providerId]) {
              result[providerId] = {};
            }
            const distribution = oneproviderDistribution.distributionPerStorageBackend;
            for (const [storageId, distributionData] of Object.entries(distribution)) {
              if (!distributionData.success) {
                // Indicate failure for this storage backend
                result[providerId][storageId] = providerDistributionFailure;
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
      if (this.filesSize === 0) {
        return {};
      }
      const result = {};
      for (
        const [
          providerId,
          physicalSizes,
        ] of Object.entries(this.physicalSizePerStorageBackend)
      ) {
        if (physicalSizes === providerDistributionFailure) {
          // Indicate failure for this provider
          result[providerId] = providerDistributionFailure;
        } else {
          result[providerId] = {};
          for (const [storageId, physicalSize] of Object.entries(physicalSizes)) {
            if (physicalSize === providerDistributionFailure) {
              // Indicate failure for this storage backend
              result[providerId][storageId] = providerDistributionFailure;
            } else {
              result[providerId][storageId] = (physicalSize / this.filesSize) * 100;
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
      if (this.filesSize === 0) {
        return {};
      }
      const result = {};
      let totalPercentage = 0;
      let isAnyProviderFailed = false;
      const percentagePerStorageBackendEntries = Object.entries(
        this.percentagePerStorageBackend
      );
      for (const [providerId, percentages] of percentagePerStorageBackendEntries) {
        if (percentages === providerDistributionFailure) {
          // Indicate failure for this provider
          result[providerId] = providerDistributionFailure;
          isAnyProviderFailed = true;
        } else {
          result[providerId] = {};
          for (const [storageId, percentage] of Object.entries(percentages)) {
            if (percentage === providerDistributionFailure) {
              // Indicate failure for this storage backend
              result[providerId][storageId] = providerDistributionFailure;
              isAnyProviderFailed = true;
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
      if (totalPercentage > 100 || isAnyProviderFailed) {
        return result;
      }

      // Adjust the percentages to ensure they sum up to 100
      let adjustment = 100 - totalPercentage;
      while (adjustment > 0) {
        let maxFraction = -1;
        let maxProviderId = null;
        let maxStorageId = null;

        for (const [providerId, percentages] of percentagePerStorageBackendEntries) {
          if (percentages !== providerDistributionFailure) {
            for (const [storageId, percentage] of Object.entries(percentages)) {
              if (percentage > 1) {
                const fraction = percentage - Math.floor(percentage);
                if (
                  fraction > maxFraction &&
                  Math.floor(percentage) === Math.floor(result[providerId][storageId])
                ) {
                  maxFraction = fraction;
                  maxProviderId = providerId;
                  maxStorageId = storageId;
                }
              }
            }
          }
        }
        if (maxProviderId === null || maxStorageId === null || maxFraction <= 0) {
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
