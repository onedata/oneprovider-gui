import Component from '@ember/component';
import { computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import _ from 'lodash';
// FIXME: rename/refactor the util
import parseLogError from 'oneprovider-gui/utils/parse-recall-error';
import { inject as service } from '@ember/service';
import { or, getBy, raw } from 'ember-awesome-macros';

const QosNotDoneReasonEnum = Object.freeze({
  deleted: 'file deleted',
  alreadyReplicated: 'file already replicated',
});

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
  qosLogStatus: undefined,

  /**
   * @virtual
   * @type {QosLogReason}
   */
  qosLogReason: undefined,

  /**
   * @virtual
   * @type {QosLogEntryType}
   */
  entryType: 'unknown',

  /**
   * @type {ComputedProperty<SafeString>}
   */
  displayedMessage: computed('qosLogReason', function displayedMessage() {
    const {
      qosLogStatus,
      qosLogReason,
      errorInfo,
    } = this.getProperties(
      'qosLogStatus',
      'qosLogReason',
      'errorInfo',
    );
    let text = '';
    if (qosLogStatus) {
      text = qosLogStatus;
    }
    if (qosLogReason) {
      let reasonMessage;
      if (typeof qosLogReason === 'string') {
        reasonMessage = qosLogReason;
      } else {
        reasonMessage = errorInfo.message || this.t('unknown');
      }
      if (text) {
        text = `${text}: ${_.lowerFirst(reasonMessage)}`;
      } else {
        text = reasonMessage;
      }
    }
    if (text) {
      text = _.upperFirst(text);
    }
    return text || '–';
  }),

  /**
   * @type {ComputedProperty<RecallInfoError|null>}
   */
  errorInfo: computed('qosLogReason', function errorInfo() {
    const {
      qosLogReason,
      errorExtractor,
    } = this.getProperties('qosLogReason', 'errorExtractor');
    if (!qosLogReason || typeof qosLogReason === 'string') {
      return null;
    }
    return parseLogError(qosLogReason, errorExtractor);
  }),

  icon: or(
    getBy(
      raw({
        started: 'checkbox-pending',
        skipped: 'skipped',
        done: 'checkbox-filled',
        failed: 'checkbox-filled-x',
      }),
      'entryType',
    ),
    raw('browser-info')
  ),

  // FIXME: maybe to remove reason id

  reasonId: computed('qosLogReason', function reasonId() {
    return this.findReasonId(this.get('qosLogReason'));
  }),

  /**
   *
   * @param {QosLogReason} reason
   * @returns {string|null} id of known reason or null
   */
  findReasonId(reason) {
    if (!reason) {
      return null;
    }
    for (const reasonId in QosNotDoneReasonEnum) {
      if (QosNotDoneReasonEnum[reasonId] === reason) {
        return reasonId;
      }
    }
    return null;
  },
});
