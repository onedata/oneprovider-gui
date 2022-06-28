/**
 * Show information about single QoS requirement
 *
 * @module components/qos-modal/qos-entry
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { tag, getBy, raw } from 'ember-awesome-macros';
import { reads } from '@ember/object/computed';
import { get, computed, observer } from '@ember/object';
import { camelize } from '@ember/string';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { guidFor } from '@ember/object/internals';
import computedPipe from 'onedata-gui-common/utils/ember/computed-pipe';
import { qosRpnToInfix } from 'oneprovider-gui/utils/qos-expression-converters';
import { qosStatusIcons } from 'oneprovider-gui/components/qos-modal';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import isNewTabRequestEvent from 'onedata-gui-common/utils/is-new-tab-request-event';
import _ from 'lodash';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, createDataProxyMixin('qosEvaluation'), {
  classNames: ['qos-entry', 'qos-entry-saved', 'list-item'],

  i18n: service(),

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
   * @type {Array<QueryProperty>}
   */
  queryProperties: undefined,

  /**
   * @virtual
   * @type {Utils.QueryComponentValueBuilder}
   */
  valuesBuilder: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  getDataUrl: notImplementedIgnore,

  /**
   * @virtual
   * @type {Function}
   */
  removeQosRequirement: notImplementedReject,

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

  /**
   * @type {boolean}
   */
  areChartsInitiallyVisible: false,

  copyAnimationEndTimer: undefined,

  /**
   * @type {QosEntryInfoType}
   */
  detailsType: null,

  /**
   * @type {boolean}
   */
  isChartsSectionExpanded: false,

  /**
   * @type {boolean}
   */
  isLogsSectionExpanded: false,

  /**
   * @type {boolean}
   */
  areChartsRendered: false,

  /**
   * @type {boolean}
   */
  areLogsRendered: false,

  navigateDataTarget: '_top',

  /**
   * @type {boolean}
   */
  areChartsVisible: false,

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

  /**
   * @type {ComputedProperty<String>}
   */
  qosId: reads('qosItem.entityId'),

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

  /**
   * @virtual
   * @type {Array<StorageModel>}
   */
  storages: undefined,

  /**
   * @virtual
   * @type {Array<Models.Provider>}
   */
  providers: undefined,

  /**
   * See `model:qosReqiurement#status` for available states
   * @type {ComputedProperty<String>}
   */
  statusId: reads('statusForFile'),

  /**
   * @type {ComputedProperty<String>}
   */
  rawExpressionInfix: computedPipe('expressionRpn', qosRpnToInfix),

  /**
   * QoS fulfillment icon name
   * @type {ComputedProperty<String>}
   */
  statusIcon: getBy(raw(qosStatusIcons), 'statusId'),

  evaluationUpdater: observer(
    'rawExpressionInfix',
    'statusId',
    function evaluationUpdater() {
      this.updateQosEvaluationProxy({ replace: true });
    }
  ),

  detailsTypeObserver: observer(
    'detailsType',
    function detailsTypeObserver() {
      const detailsType = this.get('detailsType');
      const types = ['charts', 'logs'];
      if (types.includes(detailsType)) {
        const showMethod = camelize(`show-${detailsType}`);
        this[showMethod]();
      }
      _.without(types, detailsType).forEach(detailsToHide => {
        const hideMethod = camelize(`hide-${detailsToHide}`);
        this[hideMethod]();
      });
    }
  ),

  init() {
    this._super(...arguments);
    if (this.get('areChartsInitiallyVisible')) {
      this.set('detailsType', 'charts');
    }
    this.detailsTypeObserver();
  },

  /**
   * @override
   */
  fetchQosEvaluation() {
    return this.get('evaluateQosExpression')(this.get('rawExpressionInfix'));
  },

  showCharts() {
    this.setProperties({
      isChartsSectionExpanded: true,
      areChartsRendered: true,
    });
  },

  hideCharts() {
    this.set('isChartsSectionExpanded', false);
  },

  showLogs() {
    this.setProperties({
      isLogsSectionExpanded: true,
      areLogsRendered: true,
    });
  },

  hideLogs() {
    this.set('isLogsSectionExpanded', false);
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
      if (!isNewTabRequestEvent(event)) {
        this.get('closeModal')();
      }
      event.stopPropagation();
    },
    hideCharts() {
      this.set('areChartsRendered', false);
    },
    hideLogs() {
      this.set('areLogsRendered', false);
    },
    /**
     *
     * @param {QosEntryInfoType} newDetailsType
     */
    changeDetailsType(newDetailsType) {
      const currentDetailsType = this.get('detailsType');
      this.set(
        'detailsType',
        newDetailsType !== currentDetailsType ? newDetailsType : null
      );
    },
  },
});
