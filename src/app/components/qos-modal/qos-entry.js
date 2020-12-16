/**
 * Show information about single QoS requirement
 * 
 * @module components/qos-modal/qos-entry
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { promise, tag, getBy, raw } from 'ember-awesome-macros';
import { reads } from '@ember/object/computed';
import { get, computed, observer } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { guidFor } from '@ember/object/internals';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import computedPipe from 'onedata-gui-common/utils/ember/computed-pipe';
import { qosRpnToInfix } from 'oneprovider-gui/utils/qos-expression-converters';
import { qosStatusIcons } from 'oneprovider-gui/components/qos-modal';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';

export default Component.extend(I18n, createDataProxyMixin('qosEvaluation'), {
  classNames: ['qos-entry', 'qos-entry-saved', 'list-item', 'one-collapsible-list-item'],

  /**
   * @override
   */
  i18nPrefix: 'components.qosModal.qosEntry',

  /**
   * @virtual
   * @type {EmberObject} see `QosModal.QosItem`
   */
  qosItem: undefined,

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
   * @type {Function}
   */
  evaluateQosExpression: notImplementedReject,

  copyAnimationEndTimer: undefined,

  navigateDataTarget: '_top',

  /**
   * Info trigger element id
   * @type {ComputedProperty<String>}
   */
  idInfoTriggerId: tag `${'elementId'}-id-presenter-trigger`,

  /**
   * Remove trigger element id
   * @type {ComputedProperty<String>}
   */
  removeTriggerId: tag `${'elementId'}-remove-trigger`,

  /**
   * @override
   */
  fetchQosEvaluation() {
    return this.get('evaluateQosExpression')(this.get('rawExpressionInfix'));
  },

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
  inherited: reads('qosItem.inherited'),

  /**
   * @type {ComputedProperty<boolean>}
   */
  statusForFile: reads('qosItem.statusForFile'),

  /**
   * @type {ComputedProperty<Models.File>}
   */
  qosSourceFile: reads('qosItem.qosSourceFile'),

  /**
   * @type {ComputedProperty<String>}
   */
  qosSourceFileId: reads('qosSourceFile.entityId'),

  statusId: reads('statusForFile'),

  rawExpressionInfix: computedPipe('expressionRpn', qosRpnToInfix),

  statusIcon: getBy(raw(qosStatusIcons), 'statusId'),

  qosSourceFilePathProxy: promise.object(computed(
    'qosSourceFile.{name,parent}',
    async function qosSourceFilePathProxy() {
      return await resolveFilePath(this.get('qosSourceFile'))
        .then(path => stringifyFilePath(path));
    }
  )),

  qosSourceFileHref: computed('qosSourceFileId', function qosSourceFileHref() {
    const {
      getDataUrl,
      qosSourceFileId,
    } = this.getProperties('getDataUrl', 'qosSourceFileId');
    return getDataUrl({ fileId: null, selected: [qosSourceFileId] });
  }),

  rawExpressionInfixObserver: observer(
    'rawExpressionInfix',
    function rawExpressionInfixObserver() {
      console.log('FIXME: raw expression infix observer');
      this.updateQosEvaluationProxy({ replace: true });
    }
  ),

  init() {
    this._super(...arguments);
    console.log('FIXME: qos-entry init');
    this.addObserver('qosItem', () => {
      console.log('FIXME: qos item changed');
    });
  },

  actions: {
    confirmRemove() {
      const {
        qosItem,
        removeQosRequirement,
      } = this.getProperties('qosItem', 'removeQosRequirement');
      return removeQosRequirement(get(qosItem, 'qos'));
    },
    fileLinkClicked(event) {
      this.get('closeModal')();
      event.stopPropagation();
    },
  },
});
