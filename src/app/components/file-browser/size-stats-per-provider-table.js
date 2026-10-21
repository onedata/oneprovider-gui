/**
 * Show size stats of dir for oneprovider
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { array, promise } from 'ember-awesome-macros';
import { all as allFulfilled } from 'rsvp';
import I18n from 'onedata-gui-common/mixins/i18n';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';

export default Component.extend(I18n, {
  classNames: ['size-stats-per-provider-table'],

  i18n: service(),
  providerManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.sizeStatsPerProviderTable',

  /**
   * @virtual
   * @type {DirCurrentSizeStats}
   */
  dirSizeStatsValues: undefined,

  /**
   * @virtual
   * @type {boolean}
   */
  isVirtualSizeColumnShown: false,

  /**
   * @virtual
   * @type {string}
   */
  currentProviderId: undefined,

  /**
   * @type {boolean}
   */
  isSortingIconClicked: false,

  /**
   * @type {'name'|'status'}
   */
  sortingMethod: 'name',

  /**
   * @type {PromiseObject<Array<DirCurrentSizeStatsForProvider & { provider: Models.Provider }>>}
   */
  dirSizeStatsValuesWithProviderProxy: promise.object(computed(
    'dirSizeStatsValues',
    async function dirSizeStatsValuesWithProviderProxy() {
      const dirSizeStatsWithProviderPromises = [];

      Object.keys(this.dirSizeStatsValues)
        .forEach(providerId => {
          dirSizeStatsWithProviderPromises.push((async () => {
            const provider = await this.providerManager.getProviderById(providerId);
            return { ...this.dirSizeStatsValues[providerId], provider };
          })());
        });
      return await allFulfilled(dirSizeStatsWithProviderPromises);
    }
  )),

  /**
   * @type {ComputedProperty<Array<DirCurrentSizeStatsForProvider & { provider: Models.Provider }>>}
   */
  dirSizeStatsValuesWithProvider: computedLastProxyContent(
    'dirSizeStatsValuesWithProviderProxy'
  ),

  dirSizeStatsValuesSortedByName: array.sort(
    'dirSizeStatsValuesWithProvider',
    ['provider.name']
  ),

  dirSizeStatsValuesSortedByStatus: computed(
    'dirSizeStatsValuesWithProvider',
    function dirSizeStatsValuesSortedByStatus() {
      if (!this.dirSizeStatsValuesWithProvider) {
        return [];
      }

      return [...this.dirSizeStatsValuesWithProvider].sort((a, b) => {
        const sortingOrderDiff =
          this.sortingOrderByStatus(a) - this.sortingOrderByStatus(b);

        if (sortingOrderDiff !== 0) {
          return sortingOrderDiff;
        }
        return a.provider.name.localeCompare(b.provider.name);
      });
    }
  ),

  sortedDirSizeStatsValues: computed(
    'sortingMethod',
    'dirSizeStatsValuesSortedByName',
    'dirSizeStatsValuesSortedByStatus',
    function sortedDirSizeStatsValues() {
      if (this.sortingMethod === 'status') {
        return this.dirSizeStatsValuesSortedByStatus;
      }
      return this.dirSizeStatsValuesSortedByName;
    }
  ),

  sortingOrderByStatus(stat) {
    if (stat.type === 'error') {
      return stat.error.id === 'dirStatsDisabledForSpace' ? 4 : 3;
    } else {
      return (stat.dirErrorCount > 0 || stat.fileErrorCount > 0) ? 2 : 1;
    }
  },

  actions: {
    openProviderSortingPopover() {
      this.toggleProperty('isSortingIconClicked');
    },
    sortingMethodChanged(value) {
      this.set('sortingMethod', value);
    },
  },
});
