/**
 * Show information about single QoS record
 * 
 * @module components/qos-modal/qos-entry
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { conditional, raw, promise } from 'ember-awesome-macros';
import { reads } from '@ember/object/computed';
import { get, computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { notImplementedReject } from 'onedata-gui-common/utils/not-implemented-reject';
import { notImplementedThrow } from 'onedata-gui-common/utils/not-implemented-throw';
import { guidFor } from '@ember/object/internals';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import computedPipe from 'onedata-gui-common/utils/ember/computed-pipe';
import { qosRpnToInfix } from 'oneprovider-gui/utils/qos-rpn-to-object';

export default Component.extend(I18n, {
  tagName: '',

  /**
   * @override
   */
  i18nPrefix: 'components.qosModal.qosEntry',

  /**
   * @virutal
   * @type {Component}
   */
  collapsibleList: undefined,

  /**
   * @virtual
   * @type {EmberObject} see `QosModal.QosItem`
   */
  qosItem: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  removeQos: notImplementedReject,

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

  navigateDataTarget: '_top',

  componentGuid: computed(function guid() {
    return guidFor(this);
  }),

  /**
   * @type {ComputedProperty<Number>}
   */
  replicasNumber: reads('qosItem.replicasNum'),

  /**
   * @type {ComputedProperty<String>}
   */
  expressionRpn: reads('qosItem.expressionRpn'),

  rawExpressionInfix: computedPipe('expressionRpn', qosRpnToInfix),

  /**
   * @type {ComputedProperty<String>}
   */
  qosId: reads('qosItem.qos.entityId'),

  /**
   * @type {ComputedProperty<boolean>}
   */
  direct: reads('qosItem.direct'),

  /**
   * @type {ComputedProperty<boolean>}
   */
  fileFulfilled: reads('qosItem.fileFulfilled'),

  /**
   * @type {ComputedProperty<Models.File>}
   */
  file: reads('qosItem.file'),

  fileId: reads('file.entityId'),

  filePathProxy: promise.object(computed('file.{name,parent}', function filePathProxy() {
    return resolveFilePath(this.get('file')).then(path => stringifyFilePath(path));
  })),

  fileHref: computed('fileId', function fileHref() {
    const {
      getDataUrl,
      fileId,
    } = this.getProperties('getDataUrl', 'fileId');
    return getDataUrl({ fileId });
  }),

  statusId: conditional(
    'fileFulfilled',
    raw('fulfilled'),
    raw('pending'),
  ),

  statusIcon: conditional(
    'fileFulfilled',
    raw('checkbox-filled'),
    raw('checkbox-pending'),
  ),

  actions: {
    disableEnterKey(keyEvent) {
      if (keyEvent.key === 'Enter') {
        keyEvent.preventDefault();
      }
    },
    confirmRemove() {
      const {
        qosItem,
        removeQos,
      } = this.getProperties('qosItem', 'removeQos');
      return removeQos(get(qosItem, 'qos'));
    },
    fileLinkClicked(event) {
      this.get('closeModal')();
      event.stopPropagation();
    },
  },
});
