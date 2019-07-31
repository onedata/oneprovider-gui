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
import PromiseObject from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';
import _ from 'lodash';

const numberOfDirs = 1;

const rootDir = {
  id: 'root',
  name: 'Some Space',
  hasParent: false,
};

const dirs = _.range(0, numberOfDirs).map(i => ({
  id: `file-${i}`,
  name: `Directory ${i}`,
}));

for (let i = 0; i < numberOfDirs; ++i) {
  dirs[i].parent = PromiseObject.create({
    promise: resolve(i > 0 ? dirs[i - 1] : rootDir),
  });
  dirs[i].hasParent = true;
}

export default Component.extend({
  classNames: ['content-file-browser'],

  spaceId: 'mock_space_id',
  fileId: 'mock_dir_id',

  dirId: reads('fileId'),

  dir: dirs[dirs.length - 1],
});
