export default {
  permissionGroups: {
    data: 'Data',
    acl: 'ACL',
    metadata: 'Metadata',
    attributes: 'Attributes',
    general: 'General',
  },
  permissions: {
    read_object: 'Read',
    list_container: 'List files',
    write_object: 'Write',
    add_object: 'Add files',
    add_subcontainer: 'Add subdirectory',
    traverse_container: 'Traverse directory',
    delete_child: 'Delete child',
    read_acl: 'Read ACL',
    change_acl: 'Change ACL',
    read_metadata: 'Read metadata',
    write_metadata: 'Write metadata',
    read_attributes: 'Read attributes',
    write_attributes: 'Write attributes',
    delete: 'Delete',
  },
  aceEditor: {
    aceType: 'Type',
    aceTypes: {
      allow: 'Allow',
      deny: 'Deny',
    },
    acePermissionState: {
      deny: 'denied',
      allow: 'allowed',
    },
    moveDown: 'Move down',
    moveUp: 'Move up',
    remove: 'Remove',
    unknown: 'Unknown',
    id: 'ID',
    aceSubjects: {
      user: 'user',
      group: 'group',
    },
    aceNotAccessible: 'This Access Control Entry refers to a {{subject}} that is no longer a member of this space.',
  },
  addUserOrGroup: 'Add user or group...',
  noAce: 'No Access Control Entries specified.',
  posixPermissionsWillApply: 'POSIX permissions will be applied.',
};
