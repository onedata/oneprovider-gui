/**
 * Accordion file item in multi-files mode of QoS modal
 * 
 * @module components/qos-modal/file-entry
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import { qosStatusIcons } from 'oneprovider-gui/components/qos-modal';
import QueryValueComponentsBuilderQos from 'oneprovider-gui/utils/query-value-components-builder-qos';

export default Component.extend(I18n, {
  classNames: ['qos-modal-file-entry'],

  i18nPrefix: 'components.qosModal.fileEntry',

  /**
   * @type {Component}
   * @virtual
   */
  listItem: undefined,

  /**
   * @virtual
   * @type {Utils.QosModalFileItem}
   */
  fileItem: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  removeQosRequirement: notImplementedReject,

  /**
   * @virtual
   * @type {Function}
   */
  getDataUrl: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   */
  closeModal: notImplementedThrow,

  /**
   * @virtual
   * @type {Utils.QueryComponentValueBuilder}
   */
  valuesBuilder: undefined,

  /**
   * @type {models/file}
   */
  file: reads('fileItem.file'),

  qosItemsProxy: reads('fileItem.qosItemsProxy'),

  fileQosStatus: reads('fileItem.fileQosStatus'),

  fileQosStatusIcon: computed('fileQosStatus', function fileQosStatusIcon() {
    return qosStatusIcons[this.get('fileQosStatus')];
  }),

  init() {
    this._super(...arguments);
    if (!this.get('valuesBuilder')) {
      this.set('valuesBuilder', QueryValueComponentsBuilderQos.create());
    }
  },

  /**
   * @override
   */
  didInsertElement() {
    this._super(...arguments);
    console.log('FIXME: file-entry component inserted');
  },

  actions: {
    removeQosRequirement(qosRequirement) {
      return this.get('removeQosRequirement')(qosRequirement);
    },
    getDataUrl() {
      return this.get('getDataUrl')(...arguments);
    },
    closeModal() {
      return this.get('closeModal')();
    },
    evaluateQosExpression(expression) {
      return this.get('evaluateQosExpression')(expression);
    },
  },
});
