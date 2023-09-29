/**
 * A small modal with information about cancelling the recall and confirmation buttons.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';

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
      onCancelInvoked,
      onClose,
    } = this.getProperties(
      'fileManager',
      'archiveRecallStateManager',
      'globalNotify',
      'file',
      'onCancelInvoked',
      'onClose',
    );
    // FIXME: custom property use
    try {
      const recallRootId = get(file, 'recallRootId');
      const cancelResult = await fileManager.cancelRecall(recallRootId);
      onCancelInvoked();
      return cancelResult;
    } catch (error) {
      globalNotify.backendError(this.t('cancellingRecall'), error);
      throw error;
    } finally {
      onClose();
      try {
        const watcher = archiveRecallStateManager.getWatcher(file);
        if (watcher) {
          await watcher.reloadInfo();
          await watcher.update();
        }
      } catch (error) {
        console.error(
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
