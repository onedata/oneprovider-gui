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

const FileQosSummaryBase = Component.extend(
  I18n,
);

export default FileQosSummaryBase.extend({
  classNames: ['file-qos-summary', 'loadable-row'],

  i18nPrefix: 'components.qosModal.fileQosSummary',

  file: undefined,

  removeQosRequirement: notImplementedReject,

  getDataUrl: notImplementedThrow,

  closeModal: notImplementedThrow,

  fileQosStatusChanged: notImplementedThrow,

  qosItemsProxy: undefined,

  sortedQosItems: array.sort('qosItemsProxy.content', ['direct:desc']),

  actions: {
    removeQosRequirement(qosRequirement) {
      return this.get('removeQosRequirement')(qosRequirement);
    },
    getDataUrl() {
      return this.get('getDataUrl')();
    },
    closeModal() {
      this.get('closeModal')();
    },
  },
});
