import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import File from 'oneprovider-gui/models/file';

export default Component.extend({
  spaceId: 'mock_space_id',
  fileId: 'mock_dir_id',

  dirId: reads('fileId'),

  dir: computed(function dir() {
    return File.create({
      id: this.get('dirId'),
      name: 'My directory',
      size: 350000000,
      modificationTime: Date.now(),
      provider: null,
      totalChildrenCount: 0,
      canViewDir: true,
      permissions: 0o644,
      parent: null,
    });
  }),
});
