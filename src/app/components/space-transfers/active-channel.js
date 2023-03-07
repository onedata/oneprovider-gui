/**
 * Connection between two Oneproviders on the map, showing that the transfer is in progress
 *
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { htmlSafe } from '@ember/string';
import oneproviderPlaceSizes from 'onedata-gui-common/utils/oneprovider-place-sizes';

export default Component.extend({
  tagName: '',

  map: undefined,

  /**
   * @virtual
   * @type {Object} maps Oneprovider entityId => Model.Provider
   */
  idToProviderMapping: undefined,

  providerA: oneproviderFromChannel(0),

  providerB: oneproviderFromChannel(1),

  /**
   * Pair of colors to render gradient: first color is for the left part,
   * second to the right.
   * @type {Array<number>}
   */
  gradientColors: computed(
    'oneproviderA.{entityId,longitude}',
    'oneproviderB.{entityId,longitude}',
    'providersColors',
    function gradientColors() {
      const {
        providerA,
        providerB,
        providersColors,
      } = this.getProperties('providerA', 'providerB', 'providersColors');
      let leftProvider;
      let rightProvider;
      if (get(providerA, 'longitude') <= get(providerB, 'longitude')) {
        leftProvider = providerA;
        rightProvider = providerB;
      } else {
        leftProvider = providerB;
        rightProvider = providerA;
      }
      return [
        providersColors[get(leftProvider, 'entityId')],
        providersColors[get(rightProvider, 'entityId')],
      ];
    }
  ),

  strokeGradientId: computed(
    'providerA',
    'providerB',
    function strokeGradientId() {
      return `${this.get('providerA.entityId')}-${this.get('providerB.entityId')}`;
    }
  ),

  baseStrokeWidth: computed('scale', 'mapSize', function baseStrokeWidth() {
    const {
      scale,
      mapSize,
    } = this.getProperties('scale', 'mapSize');
    if (mapSize != null && scale != null) {
      return get(oneproviderPlaceSizes(mapSize, scale), 'borderWidth');
    } else {
      return 5;
    }
  }),

  /**
   * @type {Ember.ComputedProperty<string>}
   */
  strokeStyle: computed('baseStrokeWidth', 'strokeGradientId', function style() {
    const {
      baseStrokeWidth,
      strokeGradientId,
    } = this.getProperties('baseStrokeWidth', 'strokeGradientId');
    const styles =
      `stroke-width: ${baseStrokeWidth}px; stroke: url(#${strokeGradientId});`;
    return htmlSafe(styles);
  }),

  backgroundStrokeStyle: computed('baseStrokeWidth', function backgroundStrokeStyle() {
    return htmlSafe(`stroke-width: ${this.get('baseStrokeWidth') * 2.5}px;`);
  }),
});

function oneproviderFromChannel(index) {
  return computed('idToProviderMapping', 'channel', function oneproviderX() {
    const {
      idToProviderMapping,
      channel,
    } = this.getProperties('idToProviderMapping', 'channel');
    return get(idToProviderMapping, channel[index]);
  });
}
