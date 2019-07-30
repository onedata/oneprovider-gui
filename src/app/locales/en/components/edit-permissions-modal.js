export default {
  header: 'Edit permissions',
  cancel: 'Cancel',
  save: 'Save',
  modifyingPermissions: 'modifying permissions',
  permissionsType: 'Permissions type:',
  permissionsTypeHint: 'You can choose one permissions type for each file: standard POSIX or ACL. Only the active permissions type is taken into account.',
  permisionsTypes: {
    posix: 'POSIX',
    acl: 'ACL',
  },
  editAnyway: 'Edit anyway',
  differentPermissionsTypes: 'Selected files use different permissions types. You can choose one of the types (POSIX or ACL) to be applied for all files - current permissions will be <strong>irreversibly overwritten</strong> upon save.',
  differentPosix: 'Selected files have different POSIX permissions. You can edit them, but saving your changes will cause the permissions of all files to be <strong>irreversibly overwritten</strong> with the new ones.',
  differentAcl: 'Selected files have different ACL rules. You can edit them, but saving your changes will cause the ACL rules of all files to be <strong>irreversibly overwritten</strong> with the new ones.',
};
