import Component from '@ember/component';
import { computed } from '@ember/object';
import { QosNotDoneReasonEnum, QosLogStatusEnum } from 'oneprovider-gui/services/qos-manager';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import _ from 'lodash';
// FIXME: rename/refactor the util
import parseLogError from 'oneprovider-gui/utils/parse-recall-error';
import { inject as service } from '@ember/service';
import { or, getBy, raw } from 'ember-awesome-macros';

export default Component.extend(I18n, {
  classNames: ['cell-content-message'],
  classNameBindings: ['severityClass'],

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
   * @type {QosLogSeverity}
   */
  qosLogSeverity: 'info',

  /**
   * @type {ComputedProperty<SafeString>}
   */
  displayedMessage: computed('qosLogReason', 'reasonId', function displayedMessage() {
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

  severityIcon: or(
    getBy(
      raw({
        info: 'browser-info',
        error: 'checkbox-filled-x',
      }),
      'qosLogSeverity',
    ),
    raw('browser-info')
  ),

  // FIXME: maybe to remove ids

  reasonId: computed('qosLogReason', function reasonId() {
    return this.findReasonId(this.get('qosLogReason'));
  }),

  statusId: computed('qosLogStatus', function statusId() {
    return this.findStatusId(this.get('qosLogStatus'));
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

  /**
   *
   * @param {QosLogStatus} status
   * @returns {string|null} id of known status or null
   */
  findStatusId(status) {
    if (!status) {
      return null;
    }
    for (const statusId in QosLogStatusEnum) {
      if (QosLogStatusEnum[statusId] === status) {
        return statusId;
      }
    }
    return null;
  },
});
