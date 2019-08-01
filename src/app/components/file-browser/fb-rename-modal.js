import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';
import FbSetNameModal from 'oneprovider-gui/components/file-browser/fb-set-name-modal';
import { reads } from '@ember/object/computed';

// FIXME: validate to disallow / names

export default FbSetNameModal.extend(I18n, {
  fileServer: service(),

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
        fileServer,
        editValue,
        submitDisabled,
        parentDir,
        file,
        onHide,
      } = this.getProperties(
        'fileServer',
        'editValue',
        'submitDisabled',
        'parentDir',
        'file',
        'onHide',
      );
      if (submitDisabled) {
        return;
      }
      return fileServer
        .renameFile(get(file, 'entityId'), get(parentDir, 'entityId'), editValue)
        .catch(error => {
          // FIXME: handle errors - maybe it should be presented in backend error or the same modal
          throw error;
        })
        .then(({ id: fileId }) => onHide.bind(this)(true, fileId));
    },
  },
});
