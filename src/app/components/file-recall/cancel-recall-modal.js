import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  tagName: '',

  fileManager: service(),
  archiveRecallStateManager: service(),
  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileRecall.cancelRecallModal',

  /**
   * @virtual
   * @type {Boolean}
   */
  opened: false,

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual
   * @type {() => void}
   */
  onClose: notImplementedIgnore,

  /**
   * The promise resolves or rejects as `fileManager.cancelRecall` request.
   * @returns {Promise}
   */
  async cancelRecall() {
    const {
      fileManager,
      archiveRecallStateManager,
      globalNotify,
      file,
      onClose,
    } = this.getProperties(
      'fileManager',
      'archiveRecallStateManager',
      'globalNotify',
      'file',
      'onClose',
    );
    try {
      return await fileManager.cancelRecall(file);
    } catch (error) {
      globalNotify.backendError(this.t('cancellingRecall'), error);
      onClose();
      throw error;
    } finally {
      try {
        const watcher = archiveRecallStateManager.getWatcher(file);
        if (watcher) {
          await watcher.reloadInfo();
          await watcher.update();
        }
      } catch (error) {
        console.log(
          'component:file-recall/cancel-recall-modal#cancelRecall: update watcher failed',
          error
        );
      }
    }
  },

  actions: {
    /**
     * @returns {Promise}
     */
    cancelRecall() {
      return this.cancelRecall();
    },
  },
});
