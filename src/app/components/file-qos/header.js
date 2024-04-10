/**
 * Header for QoS view
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { eq, raw } from 'ember-awesome-macros';

const mixins = [
  I18n,
];

export default Component.extend(...mixins, {
  classNames: ['file-qos-header'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileQos.header',

  /**
   * @virtual
   * @type {Utils.FileQosViewModel}
   */
  viewModel: undefined,

  /**
   * @type {ComputedProperty<Models.File>}
   */
  file: reads('viewModel.file'),

  isAddMode: eq('viewModel.activeSlideId', raw('add')),
});
