/**
 * A part of archive properties editor that allows to take submit actions
 *
 * @module components/archive-settings/submit-footer
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['archive-settings-submit-footer'],

  /**
   * @override
   */
  i18nPrefix: 'components.archiveSettings.submitFooter',

  i18n: service(),

  /**
   * @virtual
   * @type {Function}
   */
  onSubmit: notImplementedReject,

  /**
   * @virtual
   * @type {Function}
   */
  onClose: notImplementedIgnore,

  /**
   * Set to true, to disable buttons
   * @virtual optional
   * @type {Boolean}
   */
  disabled: undefined,

  actions: {
    submit() {
      this.get('onSubmit')();
    },
    close() {
      this.get('onClose')();
    },
  },
});
