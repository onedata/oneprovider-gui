/**
 * Provides footer action buttons for QoS view (eg. create new requirement).
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
  classNames: ['file-qos-footer', 'text-left'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileQos.footer',

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
