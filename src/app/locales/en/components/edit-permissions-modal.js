export default {
  header: {
    edit: 'Edit permissions',
    show: 'Permissions',
  },
  cancel: 'Cancel',
  close: 'Close',
  save: 'Save',
  modifyingPermissions: 'modifying permissions',
  permissionsModifySuccess: 'Permissions has been modified successfully',
  permissionsType: 'Permissions type:',
  permissionsTypeHint: 'You can choose one permissions type for each file: standard POSIX or ACL. Only the active permissions type is taken into account.',
  permisionsTypes: {
    posix: 'POSIX',
    acl: 'ACL',
  },
  editAnyway: 'Edit anyway',
  previewModeAcl: 'Selected file(s) use Access Control List permissions, whose details cannot be viewed in share browser.',
  differentPermissionsTypes: {
    edit: 'Selected files use different permissions types. You can choose one of the types (POSIX or ACL) to be applied for all files - current permissions will be <strong>irreversibly overwritten</strong> upon save.',
    show: 'Selected files use different permissions types (POSIX or ACL). Only POSIX permissions can be viewed in share browser.',
  },
  differentPosix: {
    edit: 'Selected files have different POSIX permissions. You can edit them, but saving your changes will cause the permissions of all files to be <strong>irreversibly overwritten</strong> with the new ones.',
    show: 'Selected files have different POSIX permissions.',
  },
  differentAcl: 'Selected files have different ACL rules. You can edit them, but saving your changes will cause the ACL rules of all files to be <strong>irreversibly overwritten</strong> with the new ones.',
  noAclDueToMixedFileTypes: 'Cannot view ACL of files and directories at the same time. Select only files or only directories to enable ACL editor.',
  ownerSystemSubject: 'owner',
  groupSystemSubject: 'owning group',
  everyoneSystemSubject: 'everyone',
};
