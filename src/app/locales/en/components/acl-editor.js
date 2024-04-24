import aceEditor from './acl-editor/ace-editor';

export default {
  permissionGroups: {
    content: 'Content',
    acl: 'ACL',
    metadata: 'Metadata',
    attributes: 'Attributes',
    deletion: 'Deletion',
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
  addUserOrGroup: 'Add user or group...',
  noAce: 'No Access Control Entries specified.',
  posixPermissionsWillApply: 'POSIX permissions will be applied.',
  aceEditor,
};
