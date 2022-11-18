export default {
  types: {
    posix: 'POSIX',
    acl: 'ACL',
  },
  editorDisabled: 'Editor disabled',
  selectorHint: {
    viewDescription: 'In this view, you can modify POSIX and ACL permissions for selected items. Note, that if there is an ACL specified, the POSIX permissions are ignored.',
    dataAccessHeader: 'Data access permissions in Onedata',
    dataAccessIntro: 'The decision whether an authenticated user is allowed to perform the requested operation on files depends on a series of security checks on different levels. These include: data access caveats, space membership, dataset protection flags, space ownership, space privileges, Access Control List (ACL) and POSIX permissions.',
    dataAccessShared: 'When the file is shared, public access to the file is determined only by ACL and POSIX permissions.',
    dataAccessPosix: '<strong>POSIX permissions</strong> are typical for Unix or Linux systems for specifying access rights to files or directories. However, there is one important nuance in Onedata implementation – all space members are treated as a virtual group which is the <strong>group</strong> owner of all files in the space. This means that whenever a file is accessed by a space member who is not the owner of the file, the <strong>group</strong> permissions are considered. Permissions for <strong>other</strong> are considered when a public share is accessed (as an anonymous guest).',
    dataAccessAcl: '<strong>Access Control Lists (ACL)</strong> are a mechanism for regulating access to files and directories using hierarchical rules that grant and deny granular operations for a specific principal. An ACL is an ordered list of <strong>ACEs (Access Control Entries)</strong>. Oneprovider evaluates ACEs strictly in the same order as they were added, top-down. If any of the ACEs denies or grants access to the considered principal, evaluation is stopped. If there is no matching ACE, access is denied.',
    seePrefix: 'See the',
    seeLink: 'file permissions documentation',
    seeSuffix: 'for more.',
    close: 'OK',
  },
};
