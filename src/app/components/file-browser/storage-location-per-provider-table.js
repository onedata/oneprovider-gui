/**
 * Show storage locations of file for oneprovider
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/i18n';

export default Component.extend(I18n, {
  tagName: 'tbody',
  classNames: ['storage-location-per-provider-table'],

  /**
   * @override
   */
  i18nPrefix: 'components.storageLocationPerProviderTable',

  /**
   * @virtual
   * @type {Ember.Array<StorageLocationDisplayInfo>}
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
});
