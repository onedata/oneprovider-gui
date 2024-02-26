/**
 *
 * @param {'rules'|'permissions'} shortTypeText
 * @returns {string}
 */
function generateYouCanReset(shortTypeText) {
  return `You can reset the existing ${shortTypeText} and set new, identical ones for all the items.`;
}

function generateDifferentAfterReset(permissionsTypeText, shortTypeText) {
  return {
    info: `You have <strong>reset</strong> the ${permissionsTypeText} for the selected items and you are currently setting new, identical rules for all of them.`,
    discardInfo: `The <strong>Discard changes</strong> button will restore the previously assigned ${shortTypeText}.`,
    saveInfo: `The <strong>Save</strong> button will <strong>irreversibly</strong> overwrite the ${shortTypeText} with the ones below.`,
  };
}

/**
 * @param {'ACL rules'|'POSIX permissions'} permissionsTypeText
 * @returns {string}
 */
function generateDifferent(permissionsTypeText) {
  return `Selected items have different ${permissionsTypeText}.`;
}

export default {
  different: {
    posix: generateDifferent('POSIX permissions'),
    acl: generateDifferent('ACL rules'),
  },
  selectIndividual: 'To view them, select an individual item or items with the same rules.',
  mixedPermissions: 'Selected items use a mix of ACLs and POSIX permissions.',
  someNonOwnedPosix: 'There is at least one item with POSIX permissions that you don\'t own, preventing batch modification.',
  youCanReset: {
    posix: generateYouCanReset('permissions'),
    acl: generateYouCanReset('rules'),
  },
  differentAfterReset: {
    posix: generateDifferentAfterReset(
      'POSIX permissions',
      'permissions'
    ),
    acl: generateDifferentAfterReset(
      'ACL rules',
      'rules'
    ),
  },

  editAnyway: 'Edit anyway',
  resetAcl: 'Reset ACL',
  resetPosix: 'Reset POSIX permissions',
  noAclDueToMixedFileTypes: 'Cannot view ACL of files and directories at the same time. Select only files or only directories to enable ACL editor.',
  noAclDueToMixedFileTypesReadonly: 'Cannot view ACL of files and directories at the same time. Select only files or only directories.',
  owner: 'Owner',
  multipleOwners: '{{count}} users',
  posixNotActive: 'POSIX permissions are ignored for files/directories that have ACLs specified.',
};
