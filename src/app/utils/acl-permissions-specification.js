export default [{
  groupName: 'data',
  icon: 'browser-directory',
  privileges: [
    {
      name: 'read_object',
      context: ['file'],
      mask: 0x00000001,
    }, {
      name: 'list_container',
      context: ['directory'],
      mask: 0x00000001,
    }, {
      name: 'write_object',
      context: ['file'],
      mask: 0x00000002,
    }, {
      name: 'add_object',
      context: ['directory'],
      mask: 0x00000002,
    }, {
      name: 'append_data',
      context: ['file'],
      mask: 0x00000004,
    }, {
      name: 'add_subcontainer',
      context: ['directory'],
      mask: 0x00000004,
    }, {
      name: 'execute',
      context: ['file'],
      mask: 0x00000020,
    }, {
      name: 'traverse_container',
      context: ['directory'],
      mask: 0x00000020,
    }, {
      name: 'delete_subcontainer',
      context: ['directory'],
      mask: 0x00000040,
    }, {
      name: 'delete_object',
      context: ['directory'],
      mask: 0x00100000, // TODO changed number, consult backend
    },
  ],
}, {
  groupName: 'acl',
  icon: 'browser-permissions',
  privileges: [
    {
      name: 'read_acl',
      context: ['directory', 'file'],
      mask: 0x00020000,
    }, {
      name: 'change_acl',
      context: ['directory', 'file'],
      mask: 0x00040000,
    },
  ],
}, {
  groupName: 'metadata',
  icon: 'browser-metadata',
  privileges: [
    {
      name: 'read_metadata',
      context: ['directory', 'file'],
      mask: 0x00000008,
    }, {
      name: 'write_metadata',
      context: ['directory', 'file'],
      mask: 0x00000010,
    },
  ],
}, {
  groupName: 'attributes',
  icon: 'browser-attribute',
  privileges: [
    {
      name: 'read_attributes',
      context: ['directory', 'file'],
      mask: 0x00000080,
    }, {
      name: 'write_attributes',
      context: ['directory', 'file'],
      mask: 0x00000100,
    },
  ],
}, {
  groupName: 'general',
  icon: 'browser-permission',
  privileges: [
    {
      name: 'delete',
      context: ['directory', 'file'],
      mask: 0x00010000,
    }, {
      name: 'change_owner',
      context: ['directory', 'file'],
      mask: 0x00080000,
    },
  ],
}];
