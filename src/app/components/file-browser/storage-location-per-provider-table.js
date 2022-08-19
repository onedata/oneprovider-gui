/**
 * Show storage locations of file for oneprovider
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads } from '@ember/object/computed';

export default Component.extend({
  tagName: 'div',
  classNames: ['storage-location-per-provider-table'],

  /**
   * @virtual
   * @type {Ember.Array<Object>}
   */
  locations: undefined,

  /**
   * @type {string}
   */
  oneproviderName: reads('locations.firstObject.providerName'),
});