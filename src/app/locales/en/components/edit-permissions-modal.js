export default {
  header: 'Edit permissions',
  cancel: 'Cancel',
  save: 'Save',
  modifyingPermissions: 'modifying permissions',
  permissionsModifySuccess: 'Permissions has been modified successfully',
  permissionsType: 'Permissions type:',
  permisionsTypes: {
    posix: 'POSIX',
    acl: 'ACL',
  },
  editAnyway: 'Edit anyway',
  differentPosix: 'Selected files have different POSIX permissions. You can edit them, but saving your changes will cause the permissions of all files to be <strong>irreversibly overwritten</strong> with the new ones.',
  differentAcl: 'Selected files have different ACL rules. You can edit them, but saving your changes will cause the ACL rules of all files to be <strong>irreversibly overwritten</strong> with the new ones.',
  noAclDueToMixedFileTypes: 'Cannot view ACL of files and directories at the same time. Select only files or only directories to enable ACL editor.',
  ownerSystemSubject: 'owner',
  groupSystemSubject: 'owning group',
  everyoneSystemSubject: 'everyone',
};
