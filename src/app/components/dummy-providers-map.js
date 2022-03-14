import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { computed, get } from '@ember/object';
import ColorGenerator from 'onedata-gui-common/utils/color-generator';

export default Component.extend({
  classNames: ['dummy-providers-map'],

  mockBackend: service(),

  space: reads('mockBackend.entityRecords.space.firstObject'),

  /**
   * @type {ComputedProperty<Utils.ColorGenerator>}
   */
  colorGenerator: computed(() => new ColorGenerator()),

  providersColors: computed(
    'space.providerList.list',
    'colorGenerator',
    function providersColors() {
      const providers = this.get('space.providerList.list');
      const colorGenerator = this.get('colorGenerator');
      if (providers) {
        return providers.reduce((result, provider) => {
          const providerId = get(provider, 'entityId');
          result[providerId] = colorGenerator.generateColorForKey(providerId);
          return result;
        }, {});
      } else {
        return {};
      }
    }
  ),
});
