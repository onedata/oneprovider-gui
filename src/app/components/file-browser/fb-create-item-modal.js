import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import FbSetNameModal from 'oneprovider-gui/components/file-browser/fb-set-name-modal';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { get } from '@ember/object';

// TODO: validate to disallow / names

export default FbSetNameModal.extend(I18n, {
  fileManager: service(),
  globalNotify: service(),

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
        globalNotify,
      } = this.getProperties(
        'fileManager',
        'editValue',
        'submitDisabled',
        'itemType',
        'parentDir',
        'onHide',
        'globalNotify',
      );
      if (submitDisabled) {
        return;
      }
      this.set('processing', true);
      const parentEntityId = get(parentDir, 'entityId');
      return fileManager.createFileOrDirectory(itemType, editValue, parentDir)
        .then(file => fileManager.dirChildrenRefresh(parentEntityId).then(() => file))
        .catch(error => {
          onHide.bind(this)(false);
          globalNotify.backendError(this.t(`creating.${itemType}`), error);
          throw error;
        })
        .then(file => onHide.bind(this)(true, file))
        .finally(() => safeExec(this, 'set', 'processing', false));
    },
  },
});
