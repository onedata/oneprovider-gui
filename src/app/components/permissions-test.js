/**
 * TODO: Demo file - to remove
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { Promise, resolve } from 'rsvp';

export default Component.extend({
  files: computed(function files() {
    return [{
      name: 'file1',
      permissions: Promise.resolve({
        aclValue: [{
          subject: 'op_user.123.instance:auto',
          permissions: 393219,
          type: 'allow',
        }],
        posixValue: '664',
        type: 'acl',
        save() {
          console.log(this);
          return Promise.resolve();
        },  
      }),
    }, {
      name: 'file2',
      permissions: Promise.resolve({
        aclValue: [{
          subject: 'op_user.123.instance:auto',
          permissions: 393220,
          type: 'allow',
        }],
        posixValue: '665',
        type: 'posix',
        save() {
          console.log(this);
          return Promise.resolve();
        },  
      }),
    }];
  }),
  space: computed(function files() {
    return {
      effUserList: resolve({
        list: resolve([
          {
            constructor: {
              modelName: 'user',
            },
            id: 'op_user.123.instance:auto',
            entityId: '123',
            name: 'Borzydar',
          },
        ]),
      }),
      effGroupList: resolve({
        list: resolve([
          {
            constructor: {
              modelName: 'group',
            },
            id: 'op_group.abc.instance:auto',
            entityId: 'abc',
            name: 'Borzygrupa',
          },
        ]),
      }),
    };
  }),
});
