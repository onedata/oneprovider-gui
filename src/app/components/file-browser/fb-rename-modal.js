/**
 * Modal for renaming file/directory
 *
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import I18n from 'onedata-gui-common/mixins/i18n';
import { inject as service } from '@ember/service';
import FbSetNameModal from 'oneprovider-gui/components/file-browser/fb-set-name-modal';
import { reads } from '@ember/object/computed';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { resolve } from 'rsvp';

// TODO: validate to disallow / names

export default FbSetNameModal.extend(I18n, {
  fileManager: service(),
  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbRenameModal',

  /**
   * @override
   */
  itemType: reads('file.type'),

  /**
   * @override
   */
  onShow() {
    this._super(...arguments);
    const input = this.getInputElement();
    input.value = this.get('file.originalName');
    input.select();
  },

  actions: {
    /**
     * @override
     */
    submit() {
      const {
        fileManager,
        editValue,
        submitDisabled,
        file,
        onHide,
        globalNotify,
      } = this.getProperties(
        'fileManager',
        'editValue',
        'submitDisabled',
        'file',
        'onHide',
        'globalNotify',
      );
      if (submitDisabled) {
        return resolve();
      }
      this.set('processing', true);
      const parentId = file.relationEntityId('parent');
      return fileManager
        .renameFile(file, editValue)
        .catch(error => {
          onHide.bind(this)(false);
          globalNotify.backendError(this.t('renaming'), error);
          return refreshFile(file, fileManager, parentId)
            .finally(() => {
              throw error;
            });
        })
        .then(result => {
          return refreshFile(file, fileManager, parentId)
            .then(() => result);
        })
        .then(({ id: fileId }) => onHide.bind(this)(true, fileId))
        .finally(() => {
          safeExec(this, 'set', 'processing', false);
        });
    },
  },
});

function refreshFile(file, fileManager, parentEntityId) {
  return file.reload().then(() =>
    fileManager.dirChildrenRefresh(parentEntityId, { forced: true })
  );
}
