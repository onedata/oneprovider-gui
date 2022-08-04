/**
 * FIXME: jsdoc
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { reads } from '@ember/object/computed';

const mixins = [
  I18n,
];

export default Component.extend(...mixins, {
  classNames: ['file-metadata-header'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileMetadata.header',

  /**
   * @virtual
   * @type {Utils.FileMetadataViewModel}
   */
  viewModel: undefined,

  activeTab: reads('viewModel.activeTab'),

  metadataTypes: reads('viewModel.metadataTypes'),

  tabStateClassTypes: reads('viewModel.tabStateClassTypes'),

  effectiveReadonly: reads('viewModel.effectiveReadonly'),

  effectiveReadonlyTip: reads('viewModel.effectiveReadonlyTip'),

  actions: {
    changeTab(tabId) {
      this.viewModel.changeTab(tabId);
    },
  },
});
