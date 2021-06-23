/**
 * View for dir-based dataset that have no children.
 *
 * @module components/archive-browser/empty-dir
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbDirLoadError from 'oneprovider-gui/components/file-browser/fb-dir-load-error';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { reads } from '@ember/object/computed';

export default FbDirLoadError.extend(I18n, {
  classNames: ['archive-empty-dir'],

  /**
   * @type {(dataset: Models.Dataset) => any}
   */
  onOpenCreateArchiveModal: reads('browserModel.openCreateArchiveModal'),

  dataset: reads('browserModel.dataset'),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveBrowser.emptyDir',

  actions: {
    openCreateArchiveModal() {
      const {
        onOpenCreateArchiveModal,
        dataset,
      } = this.getProperties('onOpenCreateArchiveModal', 'dataset');
      onOpenCreateArchiveModal(dataset);
    },
  },
});