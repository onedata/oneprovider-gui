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
import I18n from 'onedata-gui-common/mixins/components/i18n';

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

  sortedDirSizeStatsValues: array.sort(
    'dirSizeStatsValuesWithProviderProxy.content',
    ['provider.name']
  ),
});
