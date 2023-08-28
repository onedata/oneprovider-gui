/**
 * Shows directory size details.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';

export default Component.extend({
  classNames: ['file-size-body', 'full-height'],

  /**
   * @virtual
   * @type {Utils.FileSizeViewModel}
   */
  viewModel: undefined,
});
