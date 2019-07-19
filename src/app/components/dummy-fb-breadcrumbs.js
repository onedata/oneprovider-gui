import Component from '@ember/component';
import PromiseObject from 'onedata-gui-common/utils/ember/promise-object';
import _ from 'lodash';
import { resolve } from 'rsvp';

const rootDir = {
  id: 'root',
  name: 'Some Space',
  hasParent: false,
};

const dirs = _.range(0, 10).map(i => ({
  id: `file-${i}`,
  name: `Directory ${i}`,
}));

for (let i = 0; i < 10; ++i) {
  dirs[i].parent = PromiseObject.create({
    promise: resolve(i > 0 ? dirs[i - 1] : rootDir),
  });
  dirs[i].hasParent = true;
}

dirs[dirs.length - 1].name += ' with very long name';

export default Component.extend({
  dir: dirs[dirs.length - 1],
});
