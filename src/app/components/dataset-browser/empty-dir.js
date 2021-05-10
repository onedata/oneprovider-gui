// FIXME: jsdoc

import FbDirLoadError from 'oneprovider-gui/components/file-browser/fb-dir-load-error';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';

export default FbDirLoadError.extend(I18n, {
  classNames: ['dataset-empty-dir'],

  /**
   * @override
   */
  i18nPrefix: 'components.datasetBrowser.emptyDir',

  /**
   * @virtual
   */
  dir: undefined,

  /**
   * @virtual
   */
  browserModel: undefined,

  /**
   * @type {ComputedProperty<Models.Dataset>
   */
  dataset: reads('dir'),

  navigateOnezoneTarget: '_top',

  rootDirId: computed('dataset.rootFile', function rootDirId() {
    const dataset = this.get('dataset');
    if (!get(dataset, 'isDatasetsRoot') && dataset.relationEntityId) {
      return dataset.relationEntityId('rootFile');
    } else {
      return null;
    }
  }),

  browseDirectoryHref: computed('browserModel', function browseDirectoryHref() {
    const {
      browserModel,
      rootDirId,
    } = this.getProperties('browserModel', 'rootDirId');

    if (browserModel) {
      return browserModel.getDataUrl({ fileId: rootDirId });
    }
  }),
});
