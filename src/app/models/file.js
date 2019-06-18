import EmberObject from '@ember/object';

export default EmberObject.extend({
  name: undefined,
  type: undefined,
  modificationTime: undefined,
  provider: undefined,
  totalChildrenCount: undefined,
  canViewDir: undefined,
  permissions: undefined,
  parent: undefined,
});
