/**
 * Standalone component to test file browser without injected properties.
 * 
 * @module components/content-file-browser-mock
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads } from '@ember/object/computed';

export default Component.extend({
  spaceId: 'mock_space_id',
  fileId: 'mock_dir_id',

  dirId: reads('fileId'),
});
