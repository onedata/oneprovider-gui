/**
 * Buttons with actions for file-qos. To use as bottom floating buttons.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/i18n';

const mixins = [
  I18n,
];

export default Component.extend(...mixins, {
  classNames: ['file-qos-bottom-toolbar', 'file-common-submit-buttons'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileQos.bottomToolbar',

  /**
   * @virtual
   * @type {Utils.FileQosViewModel}
   */
  viewModel: undefined,

  isAddDisabled: reads('viewModel.isAddDisabled'),

  addDisabledTip: reads('viewModel.manageQosDisabledTip'),

  actions: {
    addQosRequirement() {
      this.viewModel.openQosRequirementCreator();
    },
  },
});
