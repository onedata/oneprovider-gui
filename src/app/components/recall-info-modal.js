/**
 * Modal container for recall info (information about file in recalling or recalled
 * archive).
 *
 * @module components/recall-info-modal
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  globalNotify: service(),
  archiveRecallStateManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.recallInfoModal',

  /**
   * @virtual
   * @type {Boolean}
   */
  open: false,

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual
   * @type {() => void}
   */
  onHide: notImplementedIgnore,

  actions: {
    hide() {
      this.get('onHide')();
    },
  },
});
