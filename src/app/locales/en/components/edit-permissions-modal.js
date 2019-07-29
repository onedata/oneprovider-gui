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
  openEditor: 'Open editor',
  differentPermissionsTypes: 'Selected files use different permissions types. To modify permissions, you must choose a type.',
  differentPosix: 'Selected files have different POSIX permissions.',
  differentAcl: 'Selected files have different ACL rules.',
  openEditorToOverride: 'Opening editor and saving changes will override permissions in each file permanently. Are you sure?',
};
