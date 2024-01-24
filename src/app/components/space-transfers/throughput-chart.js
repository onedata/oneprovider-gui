/**
 * Chart shows the throughput of data transfers between Oneproviders.
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['transfers-throughput-chart'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceTransfers.throughputChart',

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {Ember.Array<Provider>}
   */
  providers: undefined,

  /**
   * @virtual
   * Global colors for each provider
   * @type {ComputedProperty<Object>}
   */
  providersColors: undefined,

  /**
   * @type {string}
   */
  throughputTransferType: 'all',
});
