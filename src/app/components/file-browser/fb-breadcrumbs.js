import Component from '@ember/component';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { resolve } from 'rsvp';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';

export default Component.extend(
  createDataProxyMixin('dirPath', { type: 'array' }), {
    classNames: ['fb-breadcrumbs'],

    /**
     * @type {models/file} file model of dir type
     */
    dir: undefined,

    changeDir: notImplementedReject,

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
      ]);
    },

    actions: {
      changeDir(dir) {
        this.get('changeDir')(dir);
      },
    },
  }
);

const rootDir = {
  name: 'Some Space',
};

const dir1 = {
  name: 'One Dir',
};

const dir2 = {
  name: 'Second',
};
