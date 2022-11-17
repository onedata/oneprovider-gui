/**
 * Provides footer action buttons for QoS view (eg. create new requirement).
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads } from '@ember/object/computed';

export default Component.extend({
  classNames: ['file-qos-footer'],

  /**
   * @virtual
   * @type {Utils.FileQosViewModel}
   */
  viewModel: undefined,

  isAddDisabled: reads('viewModel.isAddDisabled'),

  isAddDisabledTip: reads('viewModel.isAddDisabledTip'),

  actions: {
    addQosRequirement() {
      this.viewModel.openQosRequirementCreator();
    },
  },
});
