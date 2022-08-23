/**
 * Provides discard/save controls for file/directory/symlink permissions
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { or, not, and, raw, conditional } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';

const mixins = [
  I18n,
];

export default Component.extend(...mixins, {
  classNames: ['file-permissions-footer', 'text-left'],

  i18n: service(),

  /**
   * @virtual
   * @type {Utils.FilePermissionsViewModel}
   */
  viewModel: undefined,

  /**
   * @override
   */
  i18nPrefix: 'components.filePermissions.footer',

  isSaveDisabled: or(
    not('viewModel.isAnyModified'),
    not('viewModel.arePosixPermissionsValid'),
  ),

  isDiscardDisabled: not('viewModel.isAnyModified'),

  isSaveDisabledMessage: or(
    and(
      not('viewModel.isAnyModified'),
      computedT('disabledReason.noChanges')
    ),
    and(
      not('viewModel.arePosixPermissionsValid'),
      computedT('disabledReason.posixInvalid'),
    ),
    raw(null),
  ),

  actions: {
    async save() {

    },
    discardChanges() {
      this.viewModel.restoreOriginalPermissions();
    },
  },
});
