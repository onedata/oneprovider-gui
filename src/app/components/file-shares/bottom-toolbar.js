/**
 * Buttons with actions for file shares. To use as bottom floating buttons.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';

const mixins = [
  I18n,
];

export default Component.extend(...mixins, {
  classNames: ['file-shares-bottom-toolbar', 'file-common-submit-buttons'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileShares.bottomToolbar',

  /**
   * @virtual
   * @type {Utils.FileSharesViewModel}
   */
  viewModel: undefined,

  /**
   * @type {ComputedProperty<boolean>}
   */
  isCreateShareDisabled: reads('viewModel.isCreateShareDisabled'),

  /**
   * @type {ComputedProperty<string>}
   */
  createShareDisabledTip: reads('viewModel.createShareDisabledTip'),

  actions: {
    createShare() {
      this.viewModel.openShareCreator();
    },
  },
});
