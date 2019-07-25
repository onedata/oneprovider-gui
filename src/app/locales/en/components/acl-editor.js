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
    append_data: 'Append data',
    add_subcontainer: 'Add subdirectory',
    execute: 'Execute',
    traverse_container: 'Traverse directory',
    delete_subcontainer: 'Delete subdirectory',
    delete_object: 'Delete element',
    read_acl: 'Read ACL',
    change_acl: 'Change ACL',
    read_metadata: 'Read metadata',
    write_metadata: 'Write metadata',
    read_attributes: 'Read attributes',
    write_attributes: 'Write attributes',
    delete: 'Delete',
    change_owner: 'Change owner',
  },
  aclEntry: {
    aclType: 'Type',
    aclTypes: {
      allow: 'Allow',
      deny: 'Deny',
    },
  },
};
