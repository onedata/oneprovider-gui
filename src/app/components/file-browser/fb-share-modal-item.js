/**
 * Modal which can create a share or show link to it
 * 
 * @module components/file-browser/fb-share-modal-item
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { promise, or, isEmpty, conditional } from 'ember-awesome-macros';
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

  open: false,

  isSaving: false,

  editValue: '',

  addAnotherOneMode: false,

  submitNewDisabled: or('isSaving', isEmpty('editValue')),

  modeProxy: promise.object(computed('shareProxy.content', function modeProxy() {
    return this.get('shareProxy').then(share => share ? 'show' : 'new');
  })),

  mode: conditional(
    'addOtherMode',
    'new',
    'modeProxy.content',
  ),

  shareUrl: computed('share.entityId', function shareUrl() {
    return this.getShareUrl({ shareId: this.get('share.entityId') });
  }),

  publicShareUrl: reads('share.publicUrl'),
});
