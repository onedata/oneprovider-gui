/**
 * Map of providers, their transfers and provider transfer states.
 *
 * @module components/space-transfers/providers-map
 * @author Jakub Liput
 * @copyright (C) 2017 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get, computed } from '@ember/object';
import { A } from '@ember/array';

export default Component.extend({
  classNames: ['transfers-providers-map'],

  /**
   * @virtual
   * Cannot be null or undefined!
   * @type {Array<Provider>}
   */
  providers: undefined,

  /**
   * @virtual
   * Ids of providers that are destination of transfers
   * @type {Array<string>}
   */
  destinationProviderIds: undefined,

  /**
   * @virtual
   * Ids of providers that are sources of transfers
   * @type {Array<string>}
   */
  sourceProviderIds: undefined,

  /**
   * @virtual
   * Global colors for each provider
   * @type {ComputedProperty <Object>}
   */
  providersColors: undefined,

  /**
   * @virtual
   * Collection of [src, dest] provider IDs to create lines on map.
   * Only one for pair!
   * @type {Array<Array[string,string]>}
   */
  providerTransferConnections: undefined,

  /**
   * Maps provider entityId => Provider model
   * @type {ComputedProperty<object>}
   */
  providersMap: computed('providers.@each.entityId', function () {
    const providers = this.get('providers');
    if (providers) {
      return providers.reduce((map, provider) => {
        map[get(provider, 'entityId')] = provider;
        return map;
      }, {});
      // return _.zipObject(providers.mapBy('entityId'), providers.toArray());
    } else {
      console.warn('component:transfers/providers-map: providers list is null');
      return null;
    }
  }),

  init() {
    this._super(...arguments);
    this.setProperties({
      _providersInfoCache: A(),
    });
  },
});
