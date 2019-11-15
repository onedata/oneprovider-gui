/**
 * Renders provider selector for throughput-distribution chart.
 * 
 * @module components/space-transfers/provider-selector
 * @author Michal Borzecki, Jakub Liput
 * @copyright (C) 2018-2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default Component.extend(I18n, {
  classNames: [
    'throughput-provider-selector',
    'provider-selector',
    'dropdown',
    'settings-dropdown',
  ],

  /**
   * @override
   */
  i18nPrefix: 'components.spaceTransfers.providerSelector',

  /**
   * Null means "all providers"
   * @type {string|null}
   */
  selectedProviderId: null,

  /**
   * @virtual
   * @type {object}
   */
  providersNames: Object.freeze({}),

  /**
   * @virtual
   * @type {function}
   */
  selectProvider: notImplementedIgnore,

  /**
   * @type {Ember.ComputedProperty<string>}
   */
  selectedProviderName: computed('selectedProviderId', 'providersNames', function () {
    const {
      selectedProviderId,
      providersNames,
    } = this.getProperties('selectedProviderId', 'providersNames');
    return selectedProviderId ?
      providersNames[selectedProviderId] :
      this.t('allProviders');
  }),

  actions: {
    selectProvider(selectedProvider, popover) {
      if (popover) {
        popover.hide();
      }
      this.get('selectProvider')(selectedProvider);
    },
  },
});
