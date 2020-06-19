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

  sortedQosItems: array.sort('qosItemsProxy.content', ['direct:desc', 'entityId:desc']),

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
  },
});
