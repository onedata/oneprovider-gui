/**
 * FIXME: description
 * 
 * @module components/db-view-modal/tab-function
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
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
   * @type {string}
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

  providers: computed('providerNames.[]', function providers() {
    const providerNames = this.get('providerNames');
    if (providerNames) {
      return providerNames.join(', ');
    }
  }),

  displayedProperties: Object.freeze([
    'viewName',
    'spaceName',
    'providers',
    'spatial',
  ]),
});
