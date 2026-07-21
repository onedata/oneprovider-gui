/**
 * Show storage locations of file for storage
 *
 * @author Agnieszka Raczek
 * @copyright (C) 2026 Onedata (onedata.org)
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/i18n';

/**
 * @typedef {Object} LocationInfo
 * @property {PathLocation} path Path to file on storage.
 * @property {Provider} provider
 * @property {string} storageName Name of storage.
 */

/**
 * @typedef {Object} PathLocation
 * @property {string} [location] Path to file on storage.
 * @property {boolean} success
 * @property {Object} [error] Error object if there was an error while fetching path.
 */

export default Component.extend(I18n, {
  tagName: 'tr',
  classNames: ['oneprovider-storage-location-row'],

  errorExtractor: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.storageLocationRow',

  /**
   * @virtual
   * @type {LocationInfo}
   */
  locationInfo: undefined,

  /**
   * @type {ComputedProperty<string>}
   */
  errorMessage: computed('locationInfo.error', function errorMessage() {
    let error = this.locationInfo?.error;
    if (!error) {
      error = this.locationInfo?.path?.error;
    }
    if (error?.id === 'requiresPosixCompatibleStorage') {
      return this.t('nonPosix');
    }
    return this.errorExtractor.getMessage(error)?.message || error.description;
  }),
});
