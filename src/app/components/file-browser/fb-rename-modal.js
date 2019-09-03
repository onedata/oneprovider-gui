/**
 * 
 * 
 * @module components/file-browser/fb-rename-modal
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';
import FbSetNameModal from 'oneprovider-gui/components/file-browser/fb-set-name-modal';
import { reads } from '@ember/object/computed';

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

  onShownRender() {
    const inputElement = this.get('inputElement');
    inputElement.value = this.get('file.name');
    this._super(...arguments);
    inputElement.select();
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
        parentDir,
        file,
        onHide,
        globalNotify,
      } = this.getProperties(
        'fileManager',
        'editValue',
        'submitDisabled',
        'parentDir',
        'file',
        'onHide',
        'globalNotify',
      );
      if (submitDisabled) {
        return;
      }
      return fileManager
        .renameFile(get(file, 'entityId'), get(parentDir, 'entityId'), editValue)
        .catch(error => {
          onHide.bind(this)(false);
          globalNotify.backendError(this.t('renaming'), error);
          throw error;
        })
        .then(({ id: fileId }) => onHide.bind(this)(true, fileId));
    },
  },
});
