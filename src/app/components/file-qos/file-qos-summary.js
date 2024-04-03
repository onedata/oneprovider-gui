/**
 * A list of QoS requirements for file
 *
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { array, promise } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/i18n';
import FileArchiveInfo from 'oneprovider-gui/utils/file-archive-info';

const objectMixins = [
  I18n,
];

export default Component.extend(...objectMixins, {
  classNames: ['file-qos-summary', 'loadable-row'],

  i18nPrefix: 'components.fileQos.fileQosSummary',

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
   * @type {Utils.FileQosViewModel}
   */
  viewModel: undefined,

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
   * @virtual
   * @type {Array<QueryProperty>}
   */
  queryProperties: undefined,

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
   * If true and file has only one qos entry, then that qos entry will have
   * expanded charts by default
   * @virtual optional
   * @type {boolean}
   */
  showChartsOfSingleQos: false,

  /**
   * @type {ComputedProperty<boolean>}
   */
  areChartsInitiallyVisible: computed(
    'sortedQosItems.length',
    'showChartsOfSingleQos',
    function areChartsInitiallyVisible() {
      return this.get('showChartsOfSingleQos') &&
        this.get('sortedQosItems.length') === 1;
    }
  ),

  /**
   * @type {ComputedProperty<Array<Utils.QosItem>>}
   */
  sortedQosItems: array.sort(
    'qosItemsProxy.content',
    ['direct:desc', 'entityId:desc']
  ),

  parentBrowsableArchiveProxy: promise.object(computed(
    async function parentBrowsableArchiveProxy() {
      const fileArchiveInfo = FileArchiveInfo.create({
        ownerSource: this,
        file: this.file,
      });
      if (await fileArchiveInfo.isInArchiveProxy) {
        return await fileArchiveInfo.browsableArchiveProxy;
      } else {
        return null;
      }
    }
  )),

  /**
   * @type {ComputedProperty<Utils.BrowsableArchive|null>}
   */
  parentBrowsableArchive: reads('parentBrowsableArchiveProxy.content'),

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
