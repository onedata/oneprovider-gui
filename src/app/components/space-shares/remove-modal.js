/**
 * Shows modal asking about share deletion.
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import ProceedProcessModal from 'onedata-gui-common/components/proceed-process-modal';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { htmlSafe } from '@ember/string';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default ProceedProcessModal.extend({
  shareManager: service(),
  globalNotify: service(),

  /**
   * @virtual
   * @type {Function}
   */
  onShowShareList: notImplementedIgnore,

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

  /**
   * @override
   */
  messageText: computed(
    'share.{name,rootFileType}',
    'fileSharesCount',
    function messageText() {
      const fileSharesCount = this.get('fileSharesCount');
      let message = this.t('messageText', {
        shareName: this.get('share.name'),
        fileType: this.t('fileType.' + this.get('share.rootFileType')),
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

  /**
   * @override
   */
  proceed: computed(function proceed() {
    return () => {
      const {
        shareManager,
        share,
        globalNotify,
      } = this.getProperties('shareManager', 'share', 'globalNotify');
      return shareManager.removeShare(share)
        .then(() => {
          return this.get('onShowShareList')();
        })
        .catch(error => {
          globalNotify.backendError(this.t('deletingShare'), error);
          share.rollbackAttributes();
          this.close();
        });
    };
  }),

  fileSharesCount: reads('share.privateRootFile.shareList.list.length'),
});
