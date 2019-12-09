import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { htmlSafe } from '@ember/string';
import { reads } from '@ember/object/computed';

export default Component.extend({
  tagName: '',

  map: undefined,

  oneproviderA: computed('providersMap', 'channel', function oneproviderA() {
    const {
      providersMap,
      channel,
    } = this.getProperties('providersMap', 'channel');
    return get(providersMap, channel[0]);
  }),

  oneproviderB: computed('providersMap', 'channel', function oneproviderB() {
    const {
      providersMap,
      channel,
    } = this.getProperties('providersMap', 'channel');
    return get(providersMap, channel[1]);
  }),

  strokeGradientId: computed(
    'oneproviderA',
    'oneproviderB',
    function strokeGradientId() {
      return `${this.get('oneproviderA.entityId')}-${this.get('oneproviderB.entityId')}`;
    }
  ),

  // FIXME: the algorithm is copied from circle - it should be common
  /**
   * @type {Ember.ComputedProperty<string>}
   */
  strokeStyle: computed('scale', 'mapSize', 'strokeGradientId', function style() {
    const {
      scale,
      mapSize,
      strokeGradientId,
    } = this.getProperties('scale', 'mapSize', 'strokeGradientId');
    let styles = '';
    if (mapSize != null && scale != null) {
      const width = mapSize * 0.01 * scale;
      styles +=
        `stroke-width: ${width / 15}px; stroke: url(#${strokeGradientId});`;
    }
    return htmlSafe(styles);
  }),

});
