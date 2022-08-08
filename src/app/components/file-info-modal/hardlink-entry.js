/**
 * Renders single hardlink entry.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2021-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import isNewTabRequestEvent from 'onedata-gui-common/utils/is-new-tab-request-event';

export default Component.extend(I18n, {
  tagName: 'li',
  classNames: ['hardlink-entry'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileInfoModal.hardlinkEntry',

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual
   * @type {String}
   */
  fileUrl: undefined,

  /**
   * @virtual
   * @type {String}
   */
  path: undefined,

  /**
   * @virtual
   * @type {Function}
   * @returns {any}
   */
  closeModal: notImplementedIgnore,

  /**
   * @type {String}
   */
  navigateLinkTarget: '_top',

  /**
   * @type {ComputedProperty<String>}
   */
  icon: computed('file.{type,effFile.type}', function icon() {
    const type = this.get('file.type');
    const linkedType = this.get('file.effFile.type');

    if (linkedType === 'dir' || type === 'dir') {
      return 'browser-directory';
    } else {
      return 'browser-file';
    }
  }),

  actions: {
    linkClicked(event) {
      if (!isNewTabRequestEvent(event)) {
        this.get('closeModal')();
      }
    },
  },
});
