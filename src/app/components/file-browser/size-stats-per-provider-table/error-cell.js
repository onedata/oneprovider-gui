/**
 * Show error for oneprovider in the dir stats table
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/i18n';

export default Component.extend(I18n, {
  tagName: 'div',
  classNames: ['error-cell'],

  i18n: service(),
  appProxy: service(),
  errorExtractor: service(),
  parentAppNavigation: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.sizeStatsPerProviderTable.errorCell',

  /**
   * @virtual
   * @type {Object}
   */
  sizeStats: undefined,

  /**
   * Frame name, where Onezone providers link should be opened
   * @type {String}
   */
  navigateTarget: reads('parentAppNavigation.navigateTarget'),

  /**
   * @type {ComputedProperty<string>}
   */
  providerId: reads('sizeStats.provider.entityId'),

  /**
   * @type {ComputedProperty<string>}
   */
  errorMessage: computed('sizeStats.error', function errorMessage() {
    return this.errorExtractor.getMessage(this.sizeStats.error)?.message ||
      this.sizeStats.error.description ||
      this.t('unknownError') + ': ' + JSON.stringify(this.sizeStats.error);
  }),

  /**
   * @type {Ember.ComputedProperty<string>}
   */
  providerUrl: computed('providerId', function providerUrl() {
    const providerId = this.get('providerId');
    return this.get('appProxy').callParent('getProvidersUrl', {
      oneproviderId: providerId,
    });
  }),
});
