/**
 * Displays navigation tab links for file datasets panel.
 *
 * @module components/file-datasets/tab-bar
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';

export default Component.extend({
  classNames: ['file-datasets-tab-bar'],

  /**
   * One of: settings, archives.
   * @virtual
   * @type {String}
   */
  activeTab: undefined,

  /**
   * @virtual
   * @type {(activeTab: String) => any}
   */
  onActiveTabChange: undefined,

  /**
   * Ordered list of displayed tabs.
   * @virtual
   * @type {Array<Object>}
   */
  tabSpecs: undefined,

  actions: {
    onActiveTabChange(tabId) {
      return this.get('onActiveTabChange')(tabId);
    },
  },
});
