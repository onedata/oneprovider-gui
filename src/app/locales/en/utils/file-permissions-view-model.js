export default {
  ownerSystemSubject: 'owner',
  groupSystemSubject: 'owning group',
  everyoneSystemSubject: 'everyone',
  anonymousSystemSubject: 'anonymous',
  systemSubjectDescription: {
    group: 'space members',
    everyone: 'including anonymous',
    anonymous: 'public share access',
  },
  readonlyDueToMetadataIsProtected: 'At least one selected element metadata is write protected.',
  readonlyDueToPosixNonOwner: 'You must be the file/directory owner or a space owner to edit POSIX permissions or initialize ACL rules.',
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
  aclPermissionsWarningModal: {
    header: 'Warning',
    no: 'Cancel',
    yes: 'Proceed',
  },
  lackOfAclPermissionsWarning: 'Specified ACL rules <strong>deny you the right to read/change the ACL rules</strong>. You should grant these rights in one of the entries that matches yourself, otherwise, you will no longer be able to view or manage permissions of the {{itemType}}.',
  forbiddenAclEditor: 'The current ACL rules for {{itemType}} deny you the right to view the ACL rules.',
  selectedItems: 'selected items',
  forbiddenMessageItemType: {
    file: 'this file',
    dir: 'this directory',
    symlink: 'this symbolic link',
    multi: 'the selected items',
  },
};
