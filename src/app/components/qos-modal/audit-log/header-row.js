/**
 * A table header for QoS audit log table.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { conditional, raw } from 'ember-awesome-macros';

export default Component.extend(I18n, {
  tagName: 'tr',

  /**
   * @override
   */
  i18nPrefix: 'components.qosModal.auditLog.headerRow',

  /**
   * @virtual
   * @type {boolean}
   */
  showFileColumn: undefined,

  columnIds: conditional(
    'showFileColumn',
    raw(['timestamp', 'file', 'event']),
    raw(['timestamp', 'event'])
  ),
});
