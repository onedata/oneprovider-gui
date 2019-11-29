/**
 * Map of Oneproviders, their transfers and Oneprovider transfer states.
 *
 * @module components/space-transfers/providers-map
 * @author Jakub Liput
 * @copyright (C) 2017-2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get, computed } from '@ember/object';
import { isEmpty } from '@ember/utils';
import { A } from '@ember/array';
import _ from 'lodash';
import mutateArray from 'onedata-gui-common/utils/mutate-array';
import bidirectionalPairs from 'oneprovider-gui/utils/bidirectional-pairs';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { inject as service } from '@ember/service';
import { assert } from '@ember/debug';
import { promise } from 'ember-awesome-macros';
import Looper from 'onedata-gui-common/utils/looper';

const pollingTime = 5100;

export default Component.extend(
  createDataProxyMixin('channelDestinations'),
  createDataProxyMixin('providers', { type: 'array' }), {
    classNames: ['transfers-providers-map'],

    i18n: service(),
    transferManager: service(),

    /**
     * @virtual
     * @type {Models.Space}
     */
    space: undefined,

    /**
     * @virtual
     * Global colors for each provider
     * @type {ComputedProperty <Object>}
     */
    providersColors: undefined,

    /**
     * Created on init
     * @type {Looper}
     */
    updater: undefined,

    generalDataProxy: promise.object(
      promise.all('channelDestinationsProxy', 'providersProxy')
    ),

    transfersActiveChannelsCache: computed(() => A()),

    /**
     * Creates an array of provider ids that are destination of transfers for space
     * NOTE: returns new array every recomputation
     * @type {ComputedProperty<Array<string>>}
     */
    destinationProviderIds: computed(
      'channelDestinations',
      function getDestinationProviderIds() {
        const channelDestinations = this.get('channelDestinations');
        if (!isEmpty(channelDestinations)) {
          return _.uniq(_.flatten(_.values(channelDestinations)));
        }
      }
    ),

    /**
     * Creates an array of provider ids that are source of transfers for space
     * NOTE: returns new array every recomputation
     * @type {ComputedProperty<Array<string>>}
     */
    sourceProviderIds: computed(
      'channelDestinations',
      function sourceProviderIds() {
        const channelDestinations = this.get('channelDestinations');
        if (!isEmpty(channelDestinations)) {
          return Object.keys(channelDestinations);
        }
      }
    ),

    /**
     * Collection of connection between two providers (for map display)
     * Order in connection is random; each pair can occur once.
     * See `util:transfers/bidirectional-pairs`
     * `[['a', 'b'], ['c', 'a'], ['b', 'c']]`
     * @type {ComputedProperty<Array<ProviderTransferConnection|undefined>>}
     */
    transfersActiveChannels: computed(
      'channelDestinations',
      'transfersActiveChannelsCache',
      function transfersActiveChannels() {
        const transfersActiveChannelsCache = this.get(
          'transfersActiveChannelsCache');
        const channelDestinations = this.get('channelDestinations');
        if (channelDestinations) {
          mutateArray(
            transfersActiveChannelsCache,
            bidirectionalPairs(channelDestinations),
            (x, y) => x[0] === y[0] && x[1] === y[1]
          );
        }
        return transfersActiveChannelsCache;
      }
    ),

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
      } else {
        return {};
      }
    }),

    init() {
      this._super(...arguments);
      assert('space cannot be null', this.get('space'));
      const updater = Looper.create({
        immediate: false,
        interval: pollingTime,
      });
      updater.on('tick', () => this.updateChannelDestinationsProxy({ replace: true }));
      this.set('updater', updater);
      this.setProperties({
        _providersInfoCache: A(),
      });
    },

    destroy() {
      try {
        this.get('updater').destroy();
      } finally {
        this._super(...arguments);
      }
    },

    /**
     * @override
     * @returns {Promise<Object>}
     */
    fetchChannelDestinations() {
      const {
        transferManager,
        space,
      } = this.getProperties('transferManager', 'space');
      return transferManager.getSpaceTransfersActiveChannels(space)
        .then(({ channelDestinations }) => channelDestinations);
    },

    fetchProviders() {
      return this.get('space.providerList')
        .then(providerList => get(providerList, 'list'));
    },
  });
