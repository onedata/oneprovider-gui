/**
 * Save/discard buttons for edited metadata.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { or, and, not } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['text-left'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileMetadata.footer',

  /**
   * @virtual
   * @type {Utils.FileMetadataViewModel}
   */
  viewModel: undefined,

  isSaveDisabled: or(
    not('viewModel.isAnyModified'),
    'viewModel.isAnyInvalid',
    'viewModel.isAnyValidating'
  ),

  isDiscardDisabled: or(
    not('viewModel.isAnyModified'),
    // discard action sets isAnyValidating flag to false, so to avoid race do not allow
    // to invoke it when validating
    'viewModel.isAnyValidating'
  ),

  isSaveDisabledMessage: or(
    and('viewModel.isAnyInvalid', computedT('disabledReason.someInvalid')),
    and('viewModel.isAnyValidating', computedT('disabledReason.validating')),
    and(not('viewModel.isAnyModified'), computedT('disabledReason.noChanges')),
  ),

  actions: {
    discardChanges() {
      this.viewModel.restoreOriginalMetadata(this.viewModel.activeTab);
    },
    async save() {
      return await this.viewModel.save(this.viewModel.activeTab);
    },
  },
});
