/**
 * Provides footer action buttons for QoS view (eg. create new requirement).
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';

export default Component.extend({
  classNames: ['file-qos-footer'],

  /**
   * @virtual
   * @type {Utils.FileQosViewModel}
   */
  viewModel: undefined,
});
