import Component from '@ember/component';

export default Component.extend({
  classNames: ['acl-editor'],
  
  entries: Object.freeze([{
    type: 'allow',
    permissions: 393219,
    subject: {
      name: 'Borzo Zborzowy',
    },
  }]),

  actions: {
    aclChanged(change) {
      console.log(change);
    },
  },
});
