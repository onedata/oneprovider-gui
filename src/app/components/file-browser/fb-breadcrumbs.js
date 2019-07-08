import Component from '@ember/component';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { resolve } from 'rsvp';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import _ from 'lodash';

export default Component.extend(
  createDataProxyMixin('dirPath', { type: 'array' }), {
    classNames: ['fb-breadcrumbs'],

    /**
     * @virtual
     * @type {models/file} file model of dir type
     */
    dir: undefined,

    changeDir: notImplementedReject,

    /**
     * How many breadcrumbs items should be rendered.
     * A special element: (...) is always additionally rendered,
     * so there will be N+1 elements visible.
     * @type {Number}
     */
    elementsToShow: Infinity,

    init() {
      this._super(...arguments);
      this.updateDirPathProxy();
    },

    /**
     * @override
     */
    fetchDirPath() {
      return resolve([
        rootDir,
        dir1,
        dir2,
        // TODO: development of the breadcrumbs component
        // ..._.range(3, 6).map(i => ({ name: `Directory ${i}` })),
      ]);
    },

    actions: {
      changeDir(dir) {
        this.get('changeDir')(dir);
      },
    },
  }
);

// FIXME: mocked dir path

const rootDir = {
  name: 'Some Space',
};

const dirs = _.range(1, 10).map(i => ({
  name: `Directory ${i}`,
}));

for (let i; i < 10; ++i) {
  dirs[i].parent = resolve();
}
