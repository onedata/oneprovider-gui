import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import FbSetNameModal from 'oneprovider-gui/components/file-browser/fb-set-name-modal';

// FIXME: validate to disallow / names

export default FbSetNameModal.extend(I18n, {
  store: service(),

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
        store,
        editValue,
        itemType,
        submitDisabled,
        parentDir,
        onHide,
      } = this.getProperties(
        'store',
        'editValue',
        'submitDisabled',
        'itemType',
        'parentDir',
        'onHide',
      );
      if (submitDisabled) {
        return;
      }
      return store
        .createRecord('file', {
          name: editValue,
          type: itemType,
          parent: parentDir,
        })
        .save()
        .catch(error => {
          // FIXME: handle errors - maybe it should be presented in backend error or the same modal
          throw error;
        })
        .then(file => onHide.bind(this)(true, file));
    },
  },
});
