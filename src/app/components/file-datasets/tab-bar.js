/**
 * Displays navigation tab links for file datasets panel. 
 *
 * @module components/file-datasets/tab-bar
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { collect, raw, notEmpty } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['file-datasets-tab-bar'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileDatasets.tabBar',

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
   * Array with possible archive tab IDs.
   * @virtual optional
   * @type {Array<String>}
   */
  disabledTabs: undefined,

  /**
   * If dataset is established - provider archiveCount here.
   * Can be undefined to not render number text at all.
   * @type {Number}
   * @virtual optional
   */
  archiveCount: undefined,

  /**
   * @virtual optional
   * @type {String|SafeString}
   */
  settingsTabHint: undefined,

  /**
   * @virtual optional
   * @type {String|SafeString}
   */
  archivesTabHint: undefined,

  /**
   * @type {ComputedProperty<Boolean>}
   */
  hasArchiveCount: notEmpty('archiveCount'),

  /**
   * Ordered list of displayed tabs.
   * @type {ComputedProperty<Array<String>>}
   */
  tabIds: collect(raw('settings'), raw('archives')),

  actions: {
    onActiveTabChange(tabId) {
      return this.get('onActiveTabChange')(tabId);
    },
  },
});
