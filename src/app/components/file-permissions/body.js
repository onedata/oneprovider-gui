/**
 * Shows and allows edit file/directory permissions
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { equal, raw, conditional, not, or, and } from 'ember-awesome-macros';
import { reads } from '@ember/object/computed';
import computedT from 'onedata-gui-common/utils/computed-t';

const mixins = [
  I18n,
];

export default Component.extend(...mixins, {
  classNames: ['file-permissions-body'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.filePermissions.body',

  /**
   * @virtual
   * @type {Utils.FilePermissionsViewModel}
   */
  viewModel: undefined,

  posixViewActive: equal('viewModel.selectedPermissionsType', raw('posix')),

  aclViewActive: equal('viewModel.selectedPermissionsType', raw('acl')),

  posixPermissionsCompatible: reads('viewModel.posixPermissionsCompatible'),

  filesHaveCompatibleAcl: reads('viewModel.filesHaveCompatibleAcl'),

  filesHaveCompatiblePosixPermissions: reads(
    'viewModel.filesHaveCompatiblePosixPermissions'
  ),

  aclCompatible: reads('viewModel.aclCompatible'),

  initialPosixPermissions: reads('viewModel.initialPosixPermissions'),

  initialAcl: reads('viewModel.initialAcl'),

  acl: reads('viewModel.acl'),

  aclsProxy: reads('viewModel.aclsProxy'),

  spaceUsers: reads('viewModel.spaceUsers'),

  spaceGroups: reads('viewModel.spaceGroups'),

  systemSubjects: reads('viewModel.systemSubjects'),

  filesType: reads('viewModel.filesType'),

  effectiveReadonly: reads('viewModel.effectiveReadonly'),

  effectiveReadonlyTip: reads('viewModel.effectiveReadonlyTip'),

  isMultiFile: reads('viewModel.isMultiFile'),

  owner: reads('viewModel.ownerProxy.content'),

  /**
   * @type {Object}
   */
  errorReasonForOwnerProxy: reads('viewModel.ownerProxy.reason'),

  isPosixActivePermissionsType: equal('viewModel.activePermissionsType', raw('posix')),

  ownerLabel: conditional(
    'isMultiFile',
    computedT('allFilesOwner'),
    computedT('owner')
  ),

  isOwnerShown: and(
    not('previewMode'),
    or(
      not('isMultiFile'),
      'viewModel.filesHaveSameOwner',
    )
  ),

  actions: {
    acceptPosixIncompatibility() {
      this.viewModel.acceptPosixIncompatibility();
    },
    acceptAclIncompatibility() {
      this.viewModel.acceptAclIncompatibility();
    },
    posixPermissionsChanged(...args) {
      this.viewModel.onPosixPermissionsChanged(...args);
    },
    aclChanged(...args) {
      this.viewModel.onAclChanged(...args);
    },
  },
});
