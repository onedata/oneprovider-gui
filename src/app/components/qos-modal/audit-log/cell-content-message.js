import Component from '@ember/component';
import { computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
// FIXME: rename/refactor the util
import parseLogError from 'oneprovider-gui/utils/parse-recall-error';
import { inject as service } from '@ember/service';
import { or, getBy, raw, eq, conditional } from 'ember-awesome-macros';
import _ from 'lodash';

export default Component.extend(I18n, {
  classNames: ['cell-content-message'],

  errorExtractor: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.qosModal.auditLog.cellContentMessage',

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

  // FIXME: change type after refactor
  /**
   * @type {ComputedProperty<RecallInfoError|null>}
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

  icon: or(
    getBy(
      raw({
        started: 'checkbox-pending',
        skipped: 'browser-info',
        done: 'checkbox-filled',
        failed: 'checkbox-filled-x',
      }),
      'status',
    ),
    raw('browser-info')
  ),
});
