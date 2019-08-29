import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import FbSetNameModal from 'oneprovider-gui/components/file-browser/fb-set-name-modal';

// FIXME: validate to disallow / names

export default FbSetNameModal.extend(I18n, {
  fileManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbCreateItemModal',

  actions: {
    /**
     * @override
     */
    submit() {
      const {
        fileManager,
        editValue,
        itemType,
        submitDisabled,
        parentDir,
        onHide,
      } = this.getProperties(
        'fileManager',
        'editValue',
        'submitDisabled',
        'itemType',
        'parentDir',
        'onHide',
      );
      if (submitDisabled) {
        return;
      }
      return fileManager.createFileOrDirectory(itemType, editValue, parentDir)
        .catch(error => {
          // FIXME: handle errors - maybe it should be presented in backend error or the same modal
          throw error;
        })
        .then(file => onHide.bind(this)(true, file));
    },
  },
});
