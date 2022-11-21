export default {
  entities: {
    user: 'User',
    group: 'Group',
    other: 'Other',
  },
  entitiesSecondary: {
    user: 'owner',
    group: 'space members',
    other: 'anonymous',
  },
  entitiesTip: {
    user: 'Permissions for the owner of the file. For new files, the creator becomes the owner.',
    group: 'Permissions for all space members, applied for users other than the owner.',
    other: 'Permissions for anonymous guests accessing the file via a public share (imposes read-only mode; the write permission is always ignored).',
  },
  permissions: {
    read: 'Read',
    write: 'Write',
    execute: 'Execute',
  },
};
