import Component from '@ember/component';
import PromiseObject from 'onedata-gui-common/utils/ember/promise-object';
import _ from 'lodash';
import { resolve } from 'rsvp';
import { get, computed } from '@ember/object';
import { collect } from '@ember/object/computed';

const rootDir = {
  id: 'root',
  name: 'Some Space',
  hasParent: false,
};

const childrenCount = 10;

const dirs = _.range(0, childrenCount).map(i => ({
  id: `file-${i}`,
  name: `Directory ${i}`,
}));

for (let i = 0; i < childrenCount; ++i) {
  dirs[i].parent = PromiseObject.create({
    promise: resolve(i > 0 ? dirs[i - 1] : rootDir),
  });
  dirs[i].hasParent = true;
}

const lastDir = dirs[dirs.length - 1] || rootDir;

lastDir.name += ' with very long name';

export default Component.extend({
  classNames: ['dummy-fb-breadcrumbs'],

  dir: lastDir,

  allButtonsArray: collect('btnDummyCurrentDir', 'btnDummySpaceRootDir'),

  btnDummyCurrentDir: computed(function btnDummyCurrentDir() {
    return {
      id: 'current',
      elementClass: 'browser-space',
      icon: 'browser-cut',
      title: 'Current action',
      showIn: [
        'currentDir',
      ],
      action: () => console.log('dummy current dir action'),
    };
  }),

  btnDummySpaceRootDir: computed(function btnDummySpaceRootDir() {
    return {
      id: 'root',
      elementClass: 'browser-group',
      icon: 'browser-copy',
      title: 'Root action',
      showIn: [
        'currentDir',
        'spaceRootDir',
      ],
      action: () => console.log('dummy root dir action'),
    };
  }),

  actions: {
    changeDir(item) {
      console.log(`Will change dir to: ${get(item, 'file.name')}`);
    },
  },
});
