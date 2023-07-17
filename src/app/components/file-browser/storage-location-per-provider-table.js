/**
 * Show storage locations of file for oneprovider
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: 'tbody',
  classNames: ['storage-location-per-provider-table'],

  errorExtractor: service(),

  /**
   * @virtual
   * @type {Ember.Array<Object>}
   */
  locations: undefined,

  /**
   * @type {ComputedProperty<Models.Provider>}
   */
  oneprovider: reads('locations.firstObject.provider'),

  /**
   * @type {ComputedProperty<string>}
   */
  errorMessage: computed('locations.firstObject.error', function errorMessage() {
    return this.errorExtractor.getMessage(this.locations.firstObject.error)?.message ||
      this.locations.firstObject.error.description;
  }),
});
