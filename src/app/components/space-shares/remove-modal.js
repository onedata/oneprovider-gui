/**
 * Shows modal asking about share deletion.
 *
 * @module components/space-shares/remove-modal
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import ProceedProcessModal from 'onedata-gui-common/components/proceed-process-modal';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { htmlSafe } from '@ember/string';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';

export default ProceedProcessModal.extend({
  shareManager: service(),

  /**
   * @virtual
   * @type {Function}
   */
  showShareList: notImplementedThrow,

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
    'share.{name,fileType}',
    'fileSharesCount',
    function messageText() {
      const fileSharesCount = this.get('fileSharesCount');
      let message = this.t('messageText', {
        shareName: this.get('share.name'),
        fileType: this.t('fileType.' + this.get('share.fileType')),
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
      } = this.getProperties('shareManager', 'share');
      return shareManager.removeShare(share)
        .then(() => {
          return this.get('showShareList')();
        });
    };
  }),

  fileSharesCount: reads('share.privateRootFile.shareList.list.length'),
});
