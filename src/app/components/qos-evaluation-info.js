/**
 * Shows info about QoS expression evaluation: storages matching or parse error
 *
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/i18n';

export default Component.extend(I18n, {
  classNames: ['qos-evaluation-info'],

  /**
   * @override
   */
  i18nPrefix: 'components.qosEvaluationInfo',

  /**
   * @virtual
   * @type {PromiseObject<Object>}
   */
  qosEvaluationProxy: undefined,

  /**
   * QoS expression parser error message
   * @type {ComputedProperty<String>}
   */
  errorMessage: computed('qosEvaluationProxy.isRejected', function errorMessage() {
    const errorReason = this.get('qosEvaluationProxy.reason');
    if (errorReason) {
      if (errorReason.id === 'invalidQosExpression') {
        const detailsReason = get(errorReason, 'details.reason');
        return `${this.t('invalidQosExpression')}${detailsReason ? ': ' + detailsReason : this.t('invalidUnknown')}`;
      } else {
        return errorReason.description;
      }
    } else {
      return this.t('qosEvaluationUnknownError');
    }
  }),
});
