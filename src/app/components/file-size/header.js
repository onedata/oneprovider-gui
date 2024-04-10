/**
 * Selector of size details type when showing space root dir.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { SpaceSizeStatsType } from 'oneprovider-gui/services/production/file-manager';

export default Component.extend(I18n, {
  classNames: ['file-size-header'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileSize.header',

  /**
   * @virtual
   * @type {Utils.FileSizeViewModel}
   */
  viewModel: undefined,

  /**
   * @type {Array<SpaceSizeStatsType>}
   */
  statsTypes: Object.freeze([
    SpaceSizeStatsType.All,
    SpaceSizeStatsType.RegularData,
    SpaceSizeStatsType.Archives,
    SpaceSizeStatsType.Trash,
  ]),

  actions: {
    changeTab(tabId) {
      this.viewModel.changeTab(tabId);
    },
  },
});
