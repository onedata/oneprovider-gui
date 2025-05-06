const customJson = 'Custom JSON metadata assigned to the file';

export default {
  name: {
    firstColumnName: 'Files',
    size: 'Size',
    owner: 'Owner',
    modification: 'Modified',
    replication: 'Replication',
    qos: 'QoS',
    atime: 'Accessed',
    ctime: 'Changed',
    // TODO: VFS-12343 restore creationTime in GUI
    // creationTime: 'Created',
    fileId: 'File ID',
    posixPermissions: 'Permissions',
  },
  tip: {
    qos: 'The aggregated fulfillment status of the imposed Quality of Service requirements.',
    replication: 'The ratio of file/directory data stored on the current Oneprovider\'s (<strong>{{oneprovider}}</strong>) storage systems compared to its logical size.',
    modification: 'Last time the item\'s content was modified. For files, indicates the time of the last write or truncate operation on the file. For directories, updated when a child item is added, renamed or deleted.',
    atime: 'Last time the item was accessed.',
    ctime: 'Last time the item\'s metadata was changed, e.g. permissions. It\' s also always updated when the modification time changes.',
    creationTime: 'Time the item was created.',
    posixPermissions: 'Permissions regulating data access rights. It can be expressed either by the standard POSIX permissions system or by the Access Control List (ACL). If there is an ACL specified, the POSIX permissions are ignored.<br>Click on the cell to see more details.',
    xattr: 'The extended attribute value for key: <strong>{{key}}</strong>',
    json: {
      all: `${customJson} (mode: whole document).`,
      key: `${customJson} (mode: extract key <strong>"{{key}}"</strong>).`,
      query: `${customJson} (mode: extract JSONata query <strong>"{{query}}"</strong>).`,
    },
    fileId: {
      priv: 'File ID is a unique, global identifier associated with a file/directory. It can be used to access and interact with the file/directory using different interfaces (e.g. REST API), but only by authorized users that have permission to do so.',
      public: 'Public File ID is a unique, global identifier associated with a shared file/directory. As opposed to a non-public File ID, it grants public (unauthenticated) read-only access to the file/directory using different interfaces (e.g. REST API).',
    },
  },
  subname: {
    modification: 'content',
    ctime: 'metadata',
    xattr: 'xattr',
    json: 'JSON metadata',
    jsonShort: 'JSON',
    fileId: 'public',
  },
};
