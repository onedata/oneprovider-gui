import Component from '@ember/component';
import { computed } from '@ember/object';
import { Promise } from 'rsvp';

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
    }];
  }),
});
