/**
 * Provides discard/save controls for file/directory/symlink permissions
 *
 * @author Jakub Liput
 * @copyright (C) 2022-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { translateFileType } from 'onedata-gui-common/utils/file';

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

  isLackOfAclEditorPermissions: computed(
    'viewModel.{hasAclEditorPermissions,acl.length}',
    function isLackOfAclEditorPermissions() {
      return this.viewModel.acl?.length &&
        !this.viewModel.hasAclEditorPermissions;
    }
  ),

  reviewRulesTip: computed(
    'isLackOfAclEditorPermissions',
    'viewModel.files',
    function reviewRulesTip() {
      if (this.isLackOfAclEditorPermissions) {
        const files = this.viewModel.files;
        const itemType = files.length === 1 ?
          translateFileType(this.i18n, get(files[0], 'type')) :
          this.t('selectedItems');
        return this.t('lackOfAclPermissionsWarning', { itemType });
      }
    }
  ),
});
