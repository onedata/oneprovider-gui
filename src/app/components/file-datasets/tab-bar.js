import Component from '@ember/component';
import { collect, raw } from 'ember-awesome-macros';
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

  tabIds: collect(raw('settings'), raw('archives')),

  actions: {
    onActiveTabChange(tabId) {
      return this.get('onActiveTabChange')(tabId);
    },
  },
});
