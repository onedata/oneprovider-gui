/**
 * Submit buttons using file-permissions view model.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import SubmitButtons from 'oneprovider-gui/components/file-common/submit-buttons';
import layout from 'oneprovider-gui/templates/components/file-common/submit-buttons';
import { conditional, raw } from 'ember-awesome-macros';
import { reads } from '@ember/object/computed';

export default SubmitButtons.extend({
  classNames: ['file-permissions-submit-buttons'],
  layout,

  /**
   * @virtual
   * @type {Utils.FilePermissionsViewModel}
   */
  viewModel: undefined,

  /**
   * @override
   */
  isDiscardDisabled: reads('viewModel.isDiscardDisabled'),

  /**
   * @override
   */
  isSaveDisabled: reads('viewModel.isSaveDisabled'),

  /**
   * @override
   */
  isSaveDisabledMessage: reads('viewModel.isSaveDisabledMessage'),

  /**
   * @override
   */
  saveTip: conditional(
    'isSaveDisabled',
    'viewModel.isSaveDisabledMessage',
    raw(''),
  ),

  /**
   * @override
   */
  async onSave() {
    return this.viewModel.submit();
  },

  /**
   * @override
   */
  onDiscard() {
    this.viewModel.restoreOriginalPermissions();
  },
});
