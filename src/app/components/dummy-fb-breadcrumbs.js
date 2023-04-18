import Component from '@ember/component';
import PromiseObject from 'onedata-gui-common/utils/ember/promise-object';
import _ from 'lodash';
import { resolve } from 'rsvp';
import { get, computed } from '@ember/object';
import { collect } from '@ember/object/computed';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';

const rootDir = {
  id: 'file.root.instance:private',
  entityId: 'root',
  name: 'Some Space with very long name',
  hasParent: false,
};

const childrenCount = 4;

const dirs = _.range(0, childrenCount).map(i => {
  const entityId = `file-${i}`;
  return {
    id: `file.${entityId}.instance:private`,
    name: `Directory ${i}`,
    entityId,
  };
});

for (let i = 0; i < childrenCount; ++i) {
  dirs[i].parent = PromiseObject.create({
    promise: resolve(i > 0 ? dirs[i - 1] : rootDir),
  });
  dirs[i].hasParent = true;
}

const dirsCount = dirs.length;
const lastDir = dirs[dirsCount - 1] || rootDir;
lastDir.name += ' with very long name';

export default Component.extend({
  mockBackend: service(),

  classNames: ['dummy-fb-breadcrumbs', 'dummy-component'],

  dirFive: lastDir,
  dirFour: dirs[dirsCount - 2],
  dirThree: dirs[dirsCount - 3],
  dirTwo: dirs[dirsCount - 4],
  dirOne: rootDir,

  space: reads('mockBackend.entityRecords.space.0'),

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
