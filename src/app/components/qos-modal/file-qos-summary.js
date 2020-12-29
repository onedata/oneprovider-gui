/**
 * A list of QoS requirements for file
 * 
 * @module components/qos-modal/file-qos-summary
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { array } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';

const objectMixins = [
  I18n,
];

export default Component.extend(...objectMixins, {
  classNames: ['file-qos-summary', 'loadable-row'],

  i18nPrefix: 'components.qosModal.fileQosSummary',

  /**
   * @virtual
   */
  file: undefined,

  /**
   * @virtual
   */
  qosItemsProxy: undefined,

  /**
   * @virtual
   */
  removeQosRequirement: notImplementedReject,

  /**
   * @virtual
   */
  getDataUrl: notImplementedThrow,

  /**
   * @virtual
   */
  closeModal: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   * @param {String} expression
   * @returns {Promise<Object>} see `spaceManager#evaluateQosExpression`
   */
  evaluateQosExpression: notImplementedReject,

  /**
   * @virtual
   * @type {Utils.QueryComponentValueBuilder}
   */
  valuesBuilder: undefined,

  /**
   * @type {ComputedProperty<Array<Utils.QosItem>>}
   */
  sortedQosItems: array.sort(
    'qosItemsProxy.content',
    ['direct:desc', 'entityId:desc']
  ),

  init() {
    this._super(...arguments);
    this.set('qosItemsCache', {});
  },

  actions: {
    removeQosRequirement(qosRequirement) {
      return this.get('removeQosRequirement')(qosRequirement);
    },
    getDataUrl() {
      return this.get('getDataUrl')(...arguments);
    },
    closeModal() {
      this.get('closeModal')();
    },
    evaluateQosExpression(expression) {
      return this.get('evaluateQosExpression')(expression);
    },
  },
});
