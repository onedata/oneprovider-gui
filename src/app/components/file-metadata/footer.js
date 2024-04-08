/**
 * Save/discard buttons for edited metadata.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';

export default Component.extend(I18n, {
  classNames: ['text-left'],

  /**
   * @virtual
   * @type {Utils.FileMetadataViewModel}
   */
  viewModel: undefined,
});
