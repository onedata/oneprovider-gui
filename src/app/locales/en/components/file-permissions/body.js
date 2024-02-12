function generateDifferentPermissions(permissionsTypeText, shortTypeText) {
  return `Selected files have different ${permissionsTypeText}. You can clear them and set new ${shortTypeText} for all selected items.`;
}

function generateDifferentPermissionsCleared(permissionsTypeText, shortTypeText) {
  return {
    info: `You have <strong>cleared</strong> the ${permissionsTypeText} for the selected items and you are currently setting new, identical rules for all of them.`,
    discardInfo: `The <strong>Discard changes</strong> button will restore the previously assigned ${shortTypeText}.`,
    saveInfo: `The <strong>Save</strong> button will <strong>irreversibly</strong> overwrite the ${shortTypeText} with the ones below.`,
  };
}

export default {
  differentPosix: generateDifferentPermissions('POSIX permissions', 'permissions'),
  differentPosixCleared: generateDifferentPermissionsCleared(
    'POSIX permissions',
    'permissions'
  ),
  differentPosixReadonly: 'Selected files have different POSIX permissions. Select an individual file or files with the same permissions.',
  differentAcl: generateDifferentPermissions('ACL rules', 'permissions'),
  differentAclCleared: generateDifferentPermissionsCleared(
    'ACL rules',
    'rules'
  ),
  differentAclReadonly: 'Selected files have different ACL rules. Select an individual file or files with the same rules.',
  editAnyway: 'Edit anyway',
  clearAcl: 'Clear ACL',
  clearPosix: 'Clear POSIX permissions',
  noAclDueToMixedFileTypes: 'Cannot view ACL of files and directories at the same time. Select only files or only directories to enable ACL editor.',
  noAclDueToMixedFileTypesReadonly: 'Cannot view ACL of files and directories at the same time. Select only files or only directories.',
  owner: 'Owner',
  multipleOwners: '{{count}} users',
  spaceOwner: 'Space owner',
  spaceOwnerTip: 'As a space owner, you can view and manage POSIX and ACL permissions for any file or directory.',
};
