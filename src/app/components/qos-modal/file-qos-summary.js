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
import { array, raw } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { get, computed } from '@ember/object';

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
   * Initialized on init.
   * Stores `qosItem` objects to prevent replacing them with new versions.
   * 
   * @type {Object}
   */
  qosItemsCache: undefined,

  sortedQosItemIds: array.mapBy(
    array.sort('qosItemsProxy.content', ['direct:desc', 'entityId:desc']),
    raw('entityId'),
  ),

  sortedQosItems: computed(
    'sortedQosItemIds',
    'qosItemsCache',
    'qosItemsProxy.content',
    function sortedQosItems() {
      const {
        sortedQosItemIds,
        qosItemsCache,
        qosItemsProxy,
      } = this.getProperties('sortedQosItemIds', 'qosItemsCache', 'qosItemsProxy');
      const qosItems = get(qosItemsProxy, 'content');
      return sortedQosItemIds.map(entityId => {
        let item = qosItemsCache[entityId];
        if (!item) {
          item = (qosItemsCache[entityId] = qosItems.findBy('entityId', entityId));
        }
        return item;
      });
    }
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
