/**
 * Shows and allows to add QoS requirements for file or directory.
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
  classNames: ['file-qos-body'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileQos.body',

  /**
   * @virtual
   * @type {Utils.FileSharesViewModel}
   */
  viewModel: undefined,

  file: reads('viewModel.file'),
});
