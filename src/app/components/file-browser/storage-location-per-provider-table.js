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
import I18n from 'onedata-gui-common/mixins/i18n';

export default Component.extend(I18n, {
  tagName: 'tbody',
  classNames: ['storage-location-per-provider-table'],

  errorExtractor: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.storageLocationPerProviderTable',

  /**
   * @virtual
   * @type {Ember.Array<Object>}
   */
  locationsInfo: undefined,

  /**
   * @virtual
   * @type {string}
   */
  currentProviderId: undefined,

  /**
   * @type {ComputedProperty<Models.Provider>}
   */
  oneprovider: reads('locationsInfo.firstObject.provider'),

  /**
   * @type {ComputedProperty<string>}
   */
  errorMessage: computed('locationsInfo.firstObject.error', function errorMessage() {
    const error = this.locationsInfo.firstObject.path.error;
    return this.errorExtractor.getMessage(error)?.message || error.description;
  }),
});
