/**
 * View for dir-based dataset that have no children.
 *
 * @module components/dataset-browser/empty-dir
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

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
   * If set to true, do not show prompt for browsing archives of childrenless dataset.
   * @type {ComputedProperty<Boolean>}
   */
  archivesLinkDisabled: reads('browserModel.archivesLinkDisabled'),

  /**
   * @type {(dataset: Models.Dataset) => any}
   */
  onOpenArchivesView: reads('browserModel.openArchivesView'),

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

  actions: {
    openArchivesView() {
      const {
        onOpenArchivesView,
        dataset,
      } = this.getProperties('onOpenArchivesView', 'dataset');
      onOpenArchivesView(dataset);
    },
  },
});
