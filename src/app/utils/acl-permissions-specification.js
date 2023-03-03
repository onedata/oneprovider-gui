/**
 * Specification of permissions used in ACLs.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

export default [{
    groupName: 'data',
    icon: 'browser-directory',
    privileges: [{
        name: 'read_object',
        context: ['file'],
        mask: 0x00000001,
      },
      {
        name: 'list_container',
        context: ['dir'],
        mask: 0x00000001,
      },
      {
        name: 'write_object',
        context: ['file'],
        mask: 0x00000002,
      },
      {
        name: 'add_object',
        context: ['dir'],
        mask: 0x00000002,
      },
      {
        name: 'add_subcontainer',
        context: ['dir'],
        mask: 0x00000004,
      },
      {
        name: 'traverse_container',
        context: ['dir'],
        mask: 0x00000020,
      },
      {
        name: 'delete_child',
        context: ['dir'],
        mask: 0x00000040,
      },
    ],
  }, {
    groupName: 'acl',
    icon: 'browser-permissions',
    privileges: [{
        name: 'read_acl',
        context: ['dir', 'file'],
        mask: 0x00020000,
      },
      {
        name: 'change_acl',
        context: ['dir', 'file'],
        mask: 0x00040000,
      },
    ],
  }, {
    groupName: 'metadata',
    icon: 'browser-metadata',
    privileges: [{
        name: 'read_metadata',
        context: ['dir', 'file'],
        mask: 0x00000008,
      },
      {
        name: 'write_metadata',
        context: ['dir', 'file'],
        mask: 0x00000010,
      },
    ],
  }, {
    groupName: 'attributes',
    icon: 'browser-attribute',
    privileges: [{
        name: 'read_attributes',
        context: ['dir', 'file'],
        mask: 0x00000080,
      },
      {
        name: 'write_attributes',
        context: ['dir', 'file'],
        mask: 0x00000100,
      },
    ],
  },
  {
    groupName: 'general',
    icon: 'browser-permission',
    privileges: [{
      name: 'delete',
      context: ['dir', 'file'],
      mask: 0x00010000,
    }],
  },
];

/**
 * @type {Object}
 * ACE flags definition. These values can be used to construct `aceFlags` field
 * in ACE. Multiple flags should be joined using bitwise union. For now there is
 * only one meaningful flag - `IDENTIFIER_GROUP`.
 */
export const AceFlagsMasks = {
  NO_FLAGS: 0x00000000,
  IDENTIFIER_GROUP: 0x00000040, // Passed `identifier` in ACE object describes
  // group, not user.
};
