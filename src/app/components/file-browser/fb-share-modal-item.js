/**
 * Single already created share presented in share modal
 * 
 * @module components/file-browser/fb-share-modal-item
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: [
    'fb-share-modal-item',
  ],

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbShareModalItem',

  /**
   * @virtual
   */
  share: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  getShareUrl: notImplementedThrow,

  /**
   * Frame name, where Onezone share link should be opened
   * @type {String}
   */
  navigateShareTarget: '_top',

  shareUrl: computed('share.entityId', function shareUrl() {
    return this.getShareUrl({ shareId: this.get('share.entityId') });
  }),

  publicShareUrl: reads('share.publicUrl'),
});
