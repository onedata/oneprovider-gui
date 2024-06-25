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
    posixPermissions: 'Permissions',
  },
  tip: {
    qos: 'The aggregated fulfillment status of the imposed Quality of Service requirements.',
    replication: 'The ratio of file/directory data stored on the current Oneprovider\'s (<strong>{{oneprovider}}</strong>) storage systems compared to its logical size.',
    modification: 'Last time the item\'s content was modified. For files, indicates the time of the last write or truncate operation on the file. For directories, updated when a child item is added, renamed or deleted.',
    atime: 'Last time the item was accessed.',
    ctime: 'Last time the item\'s metadata was changed, e.g. permissions. It\' s also always updated when the modification time changes.',
    posixPermissions: 'File permission mask for UNIX or Linux systems for specifying access rights to files or directories.<br>Permissions for group refer to all space members.<br>Permissions for other are considered when a public share is accessed (as an anonymous guest).',
  },
  subname: {
    modification: 'content',
    ctime: 'metadata',
    posixPermissions: 'POSIX'
  },
};
