export default {
  differentPosix: 'Selected files have different POSIX permissions. You can edit them, but saving your changes will cause the permissions of all files to be <strong>irreversibly overwritten</strong> with the new ones.',
  differentPosixReadonly: 'Selected files have different POSIX permissions. Select an individual file or files with the same permissions.',
  differentAcl: 'Selected files have different ACL rules. You can edit them, but saving your changes will cause the ACL rules of all files to be <strong>irreversibly overwritten</strong> with the new ones.',
  differentAclReadonly: 'Selected files have different ACL rules. Select an individual file or files with the same rules.',
  // FIXME: consult i18n
  // FIXME: edit should be displayed conditionally only if posix is non-readonly
  posixNotActive: 'The active type of permissions for selected file is currently ACL. You can review and edit POSIX permissions associated with the selected file, but effectively it is not not used to evaluate access to the file as long as ACL is the chosen type.',
  editAnyway: 'Edit anyway',
  noAclDueToMixedFileTypes: 'Cannot view ACL of files and directories at the same time. Select only files or only directories to enable ACL editor.',
  noAclDueToMixedFileTypesReadonly: 'Cannot view ACL of files and directories at the same time. Select only files or only directories.',
  owner: 'Owner',
};
