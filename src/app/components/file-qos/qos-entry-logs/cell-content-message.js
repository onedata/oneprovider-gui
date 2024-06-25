/**
 * Content of table cell with message from QoS audit log.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/i18n';
import parseLogError from 'oneprovider-gui/utils/create-error-message-spec';
import { inject as service } from '@ember/service';
import { raw, eq, conditional } from 'ember-awesome-macros';
import _ from 'lodash';

export default Component.extend(I18n, {
  tagName: 'td',
  classNames: ['cell-content-message'],

  errorExtractor: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileQos.qosEntryLogs.cellContentMessage',

  /**
   * @virtual
   * @type {QosLogStatus}
   */
  status: undefined,

  /**
   * @virtual
   * @type {QosLogErrorReason}
   */
  reason: undefined,

  /**
   * Description from log entry.
   * @virtual
   * @type {string}
   */
  description: undefined,

  statusToIconMapping: Object.freeze({
    scheduled: 'checkbox-pending',
    skipped: 'browser-info',
    completed: 'checkbox-filled',
    failed: 'checkbox-filled-x',
  }),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  displayedMessage: conditional(
    eq('status', raw('failed')),
    computed('errorInfo', function displayedMessage() {
      const errorInfo = this.get('errorInfo');
      const errorInfoText = _.lowerFirst(errorInfo.message || this.t('unknownReason'));
      let text = `${this.t('failed')} ${errorInfoText}`;
      if (!text.endsWith('.')) {
        text += '.';
      }
      return text;
    }),
    'description',
  ),

  /**
   * @type {ComputedProperty<ErrorMessageSpec|null>}
   */
  errorInfo: computed('reason', function errorInfo() {
    const {
      reason,
      errorExtractor,
    } = this.getProperties('reason', 'errorExtractor');
    if (!reason || typeof reason === 'string') {
      return null;
    }
    return parseLogError(reason, errorExtractor);
  }),

  icon: computed('statusToIconMapping', 'status', function icon() {
    return this.statusToIconMapping?.[this.status] ?? 'browser-info';
  }),
});
