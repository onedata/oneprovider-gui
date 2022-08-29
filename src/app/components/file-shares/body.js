/**
 * Shows and allows to add shares of file or directory.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';

const mixins = [
  I18n,
];

export default Component.extend(...mixins, {
  classNames: ['file-shares-body'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileShares.body',

  /**
   * @virtual
   * @type {Utils.FileSharesViewModel}
   */
  viewModel: undefined,

  file: reads('viewModel.file'),

  sharesProxy: reads('viewModel.sharesProxy'),

  shares: reads('sharesProxy.content'),

  actions: {
    getShareUrl() {
      return this.viewModel.getShareUrl?.(...arguments);
    },
  },
});
