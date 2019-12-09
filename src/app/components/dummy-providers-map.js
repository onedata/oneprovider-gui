import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { computed, get } from '@ember/object';
import generateColors from 'onedata-gui-common/utils/generate-colors';

export default Component.extend({
  classNames: ['dummy-providers-map'],

  mockBackend: service(),

  space: reads('mockBackend.entityRecords.space.firstObject'),

  providersColors: computed('space.providerList.list', function providersColors() {
    const providers = this.get('space.providerList.list');
    if (providers) {
      const colors = generateColors(get(providers, 'length'));
      let i = 0;
      return providers.reduce((result, provider) => {
        result[get(provider, 'entityId')] = colors[i];
        i += 1;
        return result;
      }, {});
    } else {
      return {};
    }
  }),
});
