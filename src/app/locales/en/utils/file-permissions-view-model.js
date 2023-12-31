export default {
  ownerSystemSubject: 'owner',
  groupSystemSubject: 'owning group',
  everyoneSystemSubject: 'everyone',
  anonymousSystemSubject: 'anonymous',
  readonlyDueToMetadataIsProtected: 'At least one selected element metadata is write protected.',
  readonlyDueToPosixNonOwner: 'You have insufficient permissions to edit POSIX permissions or ACL on selected {{fileTypeText}}.',
  readonlyDueToBeingRootDir: 'Space root directory permissions cannot be changed.',
  modifyingPermissions: 'modifying permissions',
  permissionsModifySuccess: 'Permissions has been modified successfully',
  posixNotActive: {
    singular: 'Currently, POSIX permissions are ignored for selected {{fileTypeText}}, since there is an ACL specified.',
    plural: 'Currently, POSIX permissions are ignored for selected {{fileTypeText}}, since they have ACLs specified.',
  },
  disabledReason: {
    noChanges: 'No unsaved changes',
    posixInvalid: 'Entered POSIX permissions are invalid – please correct',
  },
};
