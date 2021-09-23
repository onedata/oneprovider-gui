// FIXME: jsdoc

import Component from '@ember/component';
import { collect, raw, notEmpty } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['file-datasets-tab-bar'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileDatasets.tabBar',

  activeTab: undefined,

  onActiveTabChange: undefined,

  disabledTabs: undefined,

  /**
   * If dataset is established - provider archiveCount here.
   * Can be undefined to not render number text at all.
   * @type {Number}
   * @virtual optional
   */
  archiveCount: undefined,

  settingsTabHint: undefined,

  archivesTabHint: undefined,

  hasArchiveCount: notEmpty('archiveCount'),

  tabIds: collect(raw('settings'), raw('archives')),

  actions: {
    onActiveTabChange(tabId) {
      return this.get('onActiveTabChange')(tabId);
    },
  },
});
