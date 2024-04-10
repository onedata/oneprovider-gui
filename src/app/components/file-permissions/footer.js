/**
 * Provides discard/save controls for file/directory/symlink permissions
 *
 * @author Jakub Liput
 * @copyright (C) 2022-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { conditional } from 'ember-awesome-macros';

const mixins = [
  I18n,
];

export default Component.extend(...mixins, {
  classNames: ['file-permissions-footer', 'text-left'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.filePermissions.footer',

  /**
   * @virtual
   * @type {Utils.FilePermissionsViewModel}
   */
  viewModel: undefined,

  isCurrentUserSpaceOwner: reads('viewModel.space.currentUserIsOwner'),

  reviewRulesTip: conditional(
    'viewModel.isLackOfAclEditorPermissions',
    'viewModel.lackOfAclEditorPermissionsText'
  ),
});
