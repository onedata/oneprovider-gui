/**
 * View for dir-based dataset that have no children.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbDirLoadError from 'oneprovider-gui/components/file-browser/fb-dir-load-error';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { reads } from '@ember/object/computed';
import { equal, raw } from 'ember-awesome-macros';

export default FbDirLoadError.extend(I18n, {
  classNames: ['archive-empty-dir'],

  /**
   * @type {(dataset: Models.Dataset) => any}
   */
  onOpenCreateArchiveModal: reads('browserModel.openCreateArchiveModal'),

  dataset: reads('browserModel.dataset'),

  datasetIsDetached: equal('browserModel.attachmentState', raw('detached')),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveBrowser.emptyDir',

  canCreateArchive: reads('browserModel.spacePrivileges.createArchives'),

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
