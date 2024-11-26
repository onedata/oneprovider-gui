/**
 * Shows modal asking about share deletion.
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import ProceedProcessModal from 'onedata-gui-common/components/proceed-process-modal';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { htmlSafe } from '@ember/string';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { convertFromLegacyFileTypeIfNeeded } from 'onedata-gui-common/utils/file';

export default ProceedProcessModal.extend({
  shareManager: service(),
  globalNotify: service(),

  /**
   * @virtual
   * @type {() => void}
   */
  onRemoved: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  onShowShareList: notImplementedIgnore,

  /**
   * @virtual
   * @type {OneproviderShareListItem|Models.Share}
   */
  share: undefined,

  /**
   * @override
   */
  i18nPrefix: 'components.spaceShares.removeModal',

  /**
   * @override
   */
  modalClass: 'remove-share-modal',

  /**
   * @override
   */
  modalIcon: 'sign-warning-rounded',

  shareId: reads('share.entityId'),

  /**
   * @override
   */
  messageText: computed(
    'share.{name,rootFileType}',
    'fileSharesCount',
    function messageText() {
      if (!this.share) {
        return;
      }
      const fileSharesCount = this.fileSharesCount;
      const rootFileType = convertFromLegacyFileTypeIfNeeded(this.share.rootFileType);
      let message = this.t('messageText', {
        shareName: this.share.name,
        fileType: this.t('fileType.' + rootFileType),
      });
      if (fileSharesCount && fileSharesCount > 1) {
        message = htmlSafe(
          message.string + ' ' + this.t('messageTextOtherShares', {
            otherSharesCount: fileSharesCount - 1,
          }).string
        );
      }
      return message;
    }
  ),

  fileSharesCount: reads('share.privateRootFile.shareList.list.length'),

  /**
   * @override
   */
  async proceed() {
    const {
      shareManager,
      shareId,
      globalNotify,
    } = this;
    try {
      await shareManager.removeShare(shareId);
      // FIXME: czy to musi być obok onRemoved?
      await this.onShowShareList?.();
    } catch (error) {
      globalNotify.backendError(this.t('deletingShare'), error);
    } finally {
      this.close();
    }
    this.onRemoved?.();
  },
});
