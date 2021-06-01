/**
 * Complete view needing layout (eg. modal) for purging selected archives. 
 *
 * @module components/archives-purge
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { equal, raw } from 'ember-awesome-macros';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import handleMultiFilesOperation from 'oneprovider-gui/utils/handle-multi-files-operation';

export default Component.extend(I18n, {
  // use 'archives-purge-part' CSS class to style the component
  tagName: '',

  archiveManager: service(),
  globalNotify: service(),
  errorExtractor: service(),
  i18n: service(),
  fileManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archivesPurge',

  /**
   * @virtual
   * @type {Array<Utils.BrowsableArchive>}
   */
  archives: undefined,

  /**
   * Instance of modal-like component to render layout (header, body, footer)
   * @virtual
   * @type {Component}
   */
  modal: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  onClose: notImplementedIgnore,

  /**
   * @type {Boolean}
   */
  processing: false,

  isSingleItem: equal('archives.length', raw(1)),

  actions: {
    close() {
      this.get('onClose')();
    },
    async purge() {
      const {
        archiveManager,
        globalNotify,
        archives,
        onClose,
        fileManager,
        errorExtractor,
        i18n,
        i18nPrefix,
      } = this.getProperties(
        'archiveManager',
        'globalNotify',
        'archives',
        'onClose',
        'fileManager',
        'errorExtractor',
        'i18n',
        'i18nPrefix',
      );
      let datasetIds =
        archives.map(archive => archive && archive.relationEntityId('dataset')).compact();
      datasetIds = Array.from(new Set(datasetIds));
      try {
        this.set('processing', true);
        handleMultiFilesOperation({
          files: archives,
          globalNotify,
          errorExtractor,
          i18n,
          operationErrorKey: `${i18nPrefix}.purgingArchives`,
        }, async archive => {
          await archiveManager.purgeArchive(archive);
        });
        onClose();
      } finally {
        // only a side effect
        for (const datasetId of datasetIds) {
          fileManager.dirChildrenRefresh(datasetId).catch(error => {
            console.error(
              `service:archive-manager#purgeMultipleArchives: failed to refresh archives list of dataset ${datasetId}: ${error}`
            );
          });
        }
        safeExec(this, 'set', 'processing', false);
      }
    },
  },
});
