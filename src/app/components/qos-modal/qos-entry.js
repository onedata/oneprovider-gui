/**
 * Show information about single QoS record
 * 
 * @module components/qos-modal/qos-entry
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { conditional, raw, promise, tag, not } from 'ember-awesome-macros';
import { reads } from '@ember/object/computed';
import { get, computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { notImplementedReject } from 'onedata-gui-common/utils/not-implemented-reject';
import { notImplementedThrow } from 'onedata-gui-common/utils/not-implemented-throw';
import { guidFor } from '@ember/object/internals';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import computedPipe from 'onedata-gui-common/utils/ember/computed-pipe';
import { qosRpnToInfix } from 'oneprovider-gui/utils/qos-expression-converters';
import { next, later, cancel } from '@ember/runloop';
import $ from 'jquery';

export default Component.extend(I18n, {
  classNames: ['qos-entry', 'qos-entry-saved', 'list-item', 'one-collapsible-list-item'],

  /**
   * @override
   */
  i18nPrefix: 'components.qosModal.qosEntry',

  /**
   * @virtual
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
  inherited: reads('qosItem.inherited'),

  /**
   * @type {ComputedProperty<boolean>}
   */
  fulfilledForFile: reads('qosItem.fulfilledForFile'),

  /**
   * @type {ComputedProperty<Models.File>}
   */
  qosSourceFile: reads('qosItem.qosSourceFile'),

  /**
   * @type {ComputedProperty<String>}
   */
  qosSourceFileId: reads('qosSourceFile.entityId'),

  qosSourceFilePathProxy: promise.object(computed(
    'qosSourceFile.{name,parent}',
    function qosSourceFilePathProxy() {
      return resolveFilePath(this.get('qosSourceFile'))
        .then(path => stringifyFilePath(path));
    }
  )),

  qosSourceFileHref: computed('qosSourceFileId', function qosSourceFileHref() {
    const {
      getDataUrl,
      qosSourceFileId,
    } = this.getProperties('getDataUrl', 'qosSourceFileId');
    return getDataUrl({ qosSourceFileId });
  }),

  statusId: conditional(
    'fulfilledForFile',
    raw('fulfilled'),
    raw('pending'),
  ),

  statusIcon: conditional(
    'fulfilledForFile',
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
    expressionCopied(success) {
      if (success) {
        const classes = ['animated', 'pulse-mint'];
        const className = classes.join(' ');
        const $element = $('.qos-info-row-expression .qos-expression-viewer');
        if (classes.every(cls => $element.hasClass(cls))) {
          cancel(this.get('copyAnimationEndTimer'));
          $element.removeClass(className);
          next(() => $element.addClass(className));
        } else {
          $element.addClass(className);
        }
        this.set(
          'copyAnimationEndTimer',
          later(this, () => $element.removeClass(className), 1000)
        );
      }
    },
  },
});
