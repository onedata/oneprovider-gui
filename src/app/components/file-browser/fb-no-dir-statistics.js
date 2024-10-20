/**
 * Shows information about disabled directory statistics.
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default Component.extend(I18n, {
  classNames: ['fb-no-dir-statistics'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbNoDirStatistics',

  /**
   * @virtual
   * @type {Function}
   */
  getProvidersUrl: notImplementedIgnore,

  /**
   * Frame name, where Onezone providers link should be opened
   * @type {String}
   */
  navigateProvidersTarget: '_top',

  /**
   * @type {Ember.ComputedProperty<string>}
   */
  providersUrl: computed(function providersUrl() {
    return this.getProvidersUrl({ oneproviderId: null });
  }),
});
