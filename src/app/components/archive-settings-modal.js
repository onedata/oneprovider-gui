/**
 * Standalone component for viewing and editing archive properties using archive settings
 * editor.
 *
 * @module components/archive-settings-modal
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  tagName: '',

  i18n: service(),
  archiveManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveSettingsModal',

  /**
   * @virtual
   * @type {Boolean}
   */
  open: false,

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * An archive for which info will be displayed or modified.
   * @virtual
   * @type {Utils.BrowsableArchive}
   */
  browsableArchive: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  onHide: notImplementedIgnore,

  actions: {
    hide() {
      this.get('onHide')();
    },
  },
});
