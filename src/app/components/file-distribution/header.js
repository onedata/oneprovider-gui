/**
 * File distribution view header.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { reads } from '@ember/object/computed';
import { eq } from 'ember-awesome-macros';

const mixins = [
  I18n,
];

export default Component.extend(...mixins, {
  classNames: ['file-distribution-header'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileDistribution.header',

  /**
   * @virtual
   * @type {Utils.FileDistributionViewModel}
   */
  viewModel: undefined,

  activeTab: reads('viewModel.activeTab'),

  isSingleOneprovider: eq('viewModel.oneproviders.length', 1),

  isMultiFile: reads('viewModel.isMultiFile'),

  actions: {
    changeTab(tabId) {
      this.viewModel.changeTab(tabId);
    },
  },
});
