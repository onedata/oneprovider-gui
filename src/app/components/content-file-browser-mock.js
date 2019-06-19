import Component from '@ember/component';
import { reads } from '@ember/object/computed';

export default Component.extend({
  spaceId: 'mock_space_id',
  fileId: 'mock_dir_id',

  dirId: reads('fileId'),
});
