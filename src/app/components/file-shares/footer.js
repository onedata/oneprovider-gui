/**
 * Provides footer action buttons for shares (eg. create another share).
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

const mixins = [
  I18n,
];

export default Component.extend(...mixins, {
  classNames: ['file-shares-footer', 'text-left'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileShares.footer',

  /**
   * @virtual
   * @type {Utils.FileSharesViewModel}
   */
  viewModel: undefined,

  actions: {
    createShare() {
      this.viewModel.openShareCreator();
    },
  },
});
