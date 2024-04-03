/**
 * Content of db-view-modal for showing general info of Database View (Index)
 *
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/i18n';

export default Component.extend(I18n, {
  classNames: ['tab-general'],

  /**
   * @override
   */
  i18nPrefix: 'components.dbViewModal.tabGeneral',

  /**
   * @virtual
   * @type {string}
   */
  viewName: undefined,

  /**
   * @virtual
   * @type {string}
   */
  spaceName: undefined,

  /**
   * @virtual
   * @type {boolean}
   */
  spatial: undefined,

  /**
   * @virtual
   * @type {Array<string>}
   */
  providerNames: undefined,

  /**
   * @virtual
   * @type {string}
   */
  viewOptions: undefined,

  /**
   * Stringified list of Oneprovider names
   * @type {ComputedProperty<String>}
   */
  providerNamesString: computed('providerNames.[]', function providers() {
    const providerNames = this.get('providerNames');
    if (providerNames) {
      return providerNames.join(', ');
    }
  }),

  displayedProperties: Object.freeze([
    'viewName',
    'spaceName',
    'providerNamesString',
    'spatial',
  ]),
});
