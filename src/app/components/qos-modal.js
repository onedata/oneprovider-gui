// FIXME: remove after full move
/**
 * Modal for adding QoS entries for file
 *
 * @module components/qos-modal
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import EmberObject, { get, observer, computed, setProperties, getProperties } from '@ember/object';
import { reads, gt } from '@ember/object/computed';
import { conditional, raw, equal, and, getBy, array, promise, or, not } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import { all as allFulfilled, allSettled } from 'rsvp';
import Looper from 'onedata-gui-common/utils/looper';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import QosModalFileItem from 'oneprovider-gui/utils/qos-modal-file-item';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import QueryValueComponentsBuilderQos from 'oneprovider-gui/utils/query-value-components-builder-qos';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import createQosParametersSuggestions from 'oneprovider-gui/utils/create-qos-parameters-suggestions';

export const qosStatusIcons = {
  error: 'warning',
  empty: 'circle-not-available',
  fulfilled: 'checkbox-filled',
  pending: 'checkbox-pending',
  impossible: 'checkbox-filled-warning',
};

const mixins = [
  I18n,
  createDataProxyMixin('queryProperties'),
  createDataProxyMixin('storages'),
  createDataProxyMixin('providers'),
];

export default Component.extend(...mixins, {
  qosManager: service(),
  fileManager: service(),
  globalNotify: service(),
  i18n: service(),
  spaceManager: service(),
  providerManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.qosModal',

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {boolean}
   */
  open: false,

  /**
   * @virtual
   * Files for which the modal have been opened
   * @type {Array<Models.File>}
   */
  files: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  onHide: notImplementedIgnore,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  showPrivilege: true,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  editPrivilege: true,

  /**
   * @virtual
   * @type {Function}
   */
  getDataUrl: notImplementedIgnore,

  /**
   * If modal is opened - interval in ms to auto update data
   * @type {Number}
   */
  updateInterval: conditional(
    and('open', equal('mode', raw('show'))),
    conditional(equal('allQosStatus', raw('fulfilled')), raw(15000), raw(5000)),
    null
  ),

  /**
   * Initialized in init
   * @type {Looper}
   */
  updater: null,

  /**
   * One of: show (show list of QoS requirements for file), add (form)
   * @type {String}
   */
  mode: 'show',

  /**
   * Object containing data required to create neq Models.QosRequirement
   * @type { { replicasNumber: Number, expressionInfix: Array<String> } }
   */
  newEntryData: undefined,

  /**
   * @type {String}
   */
  spaceId: reads('space.entityId'),

  /**
   * Shorthand when exactly one file is opened
   * @type {Models.File|null}
   */
  file: conditional('multipleFiles', null, 'files.firstObject'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  multipleFiles: gt('files.length', 1),

  /**
   * @type {ComputedProperty<string>} one of: file, dir
   */
  fileType: reads('file.type'),

  /**
   * @type {Array<String>}
   */
  filesStatus: array.mapBy('fileItems', raw('fileQosStatus')),

  /**
   * @type {ComputedProperty<QueryValueComponentsBuilder>}
   */
  valuesBuilder: computed(() => QueryValueComponentsBuilderQos.create()),

  noEditHint: computed(function noEditHint() {
    return insufficientPrivilegesMessage({
      i18n: this.get('i18n'),
      modelName: 'space',
      privilegeFlag: 'space_manage_qos',
    });
  }),

  fileItems: computed('files.[]', function fileItems() {
    const filesSorted = [...this.get('files')].sortBy('name');
    return filesSorted.map(file => {
      return QosModalFileItem.create({
        ownerSource: this,
        file,
      });
    });
  }),

  fileTypeText: computed('multipleFiles', 'file.type', function fileTypeText() {
    const key = this.get('multipleFiles') ? 'multi' : this.get('file.type');
    return this.t('fileType.' + key);
  }),

  /**
   * One of: error, loading, pending, impossible, fulfilled, unknown
   * @type {ComputedProperty<String>}
   */
  allQosStatus: computed('filesStatus.[]', function allQosStatus() {
    const filesStatus = this.get('filesStatus');
    for (const status of ['error', 'loading', 'pending', 'impossible', 'fulfilled']) {
      if (filesStatus.includes(status)) {
        return status;
      }
    }
    return 'unknown';
  }),

  allQosStatusIcon: getBy(raw(qosStatusIcons), 'allQosStatus'),

  /**
   * @type {ComputedProperty<QueryParameter>}
   */
  anyStorageQueryParameter: computed(function anyStorageQueryParameter() {
    return EmberObject.create({
      key: 'anyStorage',
      displayedKey: this.t('anyStorage'),
      isSpecialKey: true,
      type: 'symbol',
    });
  }),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  saveDisabled: or(not('newEntryIsValid'), not('editPrivilege')),

  /**
   * Data needed to show requirements list
   * @type {ComputedProperty<PromiseArray>}
   */
  dataProxy: promise.object(
    promise.all('queryPropertiesProxy', 'storagesProxy', 'providersProxy')
  ),

  configureUpdater: observer(
    'updater',
    'updateInterval',
    function configureUpdater() {
      this.set('updater.interval', this.get('updateInterval'));
    }
  ),

  init() {
    this._super(...arguments);
    this.initUpdater();
  },

  willDestroyElement() {
    try {
      const updater = this.get('updater');
      if (updater) {
        updater.destroy();
      }
    } finally {
      this._super(...arguments);
    }
  },

  /**
   * @override
   */
  fetchStorages() {
    const {
      spaceManager,
      spaceId,
    } = this.getProperties('spaceManager', 'spaceId');
    return spaceManager.getSupportingStorages(spaceId);
  },

  /**
   * @override
   */
  async fetchProviders() {
    const space = this.get('space');
    if (space) {
      const providerList = await get(space, 'providerList');
      const list = get(providerList, 'list');
      return list ? list.toArray() : [];
    } else {
      return [];
    }
  },

  /**
   * @override
   * For resolved object format see: `service:space-manager#getAvailableQosParameters`
   * @returns {Promise<Object>}
   */
  fetchQueryProperties() {
    const {
      spaceManager,
      spaceId,
    } = this.getProperties('spaceManager', 'spaceId');
    return spaceManager.getAvailableQosParameters(spaceId)
      .then(availableQosParameters => {
        const suggestions = createQosParametersSuggestions(availableQosParameters);
        return this.resolveSpecialSuggestions(suggestions);
      });
  },

  /**
   * @param {Array<QosParameterSuggestion>} suggestions
   * @returns {Promise}
   */
  resolveSpecialSuggestions(suggestions) {
    const anyStorageQueryParameter = this.get('anyStorageQueryParameter');
    const promises = [];
    suggestions.forEach(suggestion => {
      switch (get(suggestion, 'key')) {
        case 'storageId':
          setProperties(suggestion, {
            displayedKey: this.t('storage'),
            isSpecialKey: true,
            type: 'storage',
          });
          // not getting proxy in the method beginning, because it fires fetch
          promises.push(this.get('storagesProxy').then(storages => {
            const storageSuggestions = get(suggestion, 'allValues');
            if (storageSuggestions) {
              for (let i = 0; i < storageSuggestions.length; ++i) {
                const storageId = storageSuggestions[i];
                const storage = storages.findBy('entityId', storageId);
                storageSuggestions[i] = storage || { entityId: storageId };
              }
            }
          }));
          break;
        case 'providerId': {
          setProperties(suggestion, {
            displayedKey: this.t('provider'),
            isSpecialKey: true,
            type: 'provider',
          });
          const providerSuggestions = get(suggestion, 'allValues');
          if (providerSuggestions) {
            promises.push(this.get('providersProxy').then(providers => {
              for (let i = 0; i < providerSuggestions.length; ++i) {
                const providerId = providerSuggestions[i];
                const currentIndex = i;
                providerSuggestions[currentIndex] =
                  providers.findBy('entityId', providerId);
              }
            }));
          }
        }
        break;
        default:
          break;
      }
    });
    return allFulfilled(promises).then(() => {
      if (suggestions) {
        return [...suggestions, anyStorageQueryParameter];
      } else {
        return [anyStorageQueryParameter];
      }
    });
  },

  evaluateQosExpression(expression) {
    const {
      spaceManager,
      spaceId,
    } = this.getProperties('spaceManager', 'spaceId');
    return spaceManager.evaluateQosExpression(spaceId, expression);
  },

  initUpdater() {
    const updater = Looper.create({
      immediate: true,
    });
    updater.on('tick', () => {
      this.updateData(true);
    });
    this.set('updater', updater);
    this.configureUpdater();
  },

  async updateData(replace = false) {
    const fileItems = this.get('fileItems');
    try {
      await allFulfilled(fileItems.invoke('updateData', replace));
    } catch (error) {
      safeExec(this, 'set', 'updater.interval', null);
    }
  },

  addEntry({ replicasNumber, expressionInfix }) {
    const {
      fileItems,
      qosManager,
      fileManager,
      globalNotify,
    } = this.getProperties('fileItems', 'qosManager', 'fileManager', 'globalNotify');
    return allSettled(fileItems.map(fileItem => {
        const file = get(fileItem, 'file');
        return qosManager.createQosRequirement(file, expressionInfix, replicasNumber)
          .finally(() => {
            if (get(file, 'hardlinksCount') > 1) {
              fileManager.fileParentRefresh(file);
            }
            if (get(file, 'type') === 'dir') {
              return fileManager.dirChildrenRefresh(get(file, 'entityId'));
            }
          });
      }))
      .then(results => {
        const rejectedResult = results.findBy('state', 'rejected');
        if (rejectedResult) {
          globalNotify.backendError(this.t('addingQosEntry'), rejectedResult.reason);
          this.updateData();
          throw rejectedResult.reason;
        }
      })
      // just in case if code fails
      .catch(error => {
        globalNotify.backendError(this.t('addingQosEntry'), error);
        this.updateData();
        throw error;
      })
      .then(() => {
        const updating = this.updateData();
        safeExec(this, 'set', 'mode', 'show');
        return updating;
      });
  },

  actions: {
    onHide() {
      this.get('onHide')();
    },
    changeNewEntry(data, isValid) {
      if (data !== undefined) {
        this.set('newEntryData', data);
      }
      if (isValid !== undefined) {
        this.set('newEntryIsValid', isValid);
      }
    },
    save() {
      return this.addEntry(this.get('newEntryData'));
    },

    /**
     * @param {Utils.QosModalItem} qosItem
     */
    async removeQosRequirement(qosItem) {
      const {
        qosManager,
        fileManager,
      } = this.getProperties('qosManager', 'fileManager');
      const {
        qosSourceFile: file,
        qos: qosRequirement,
      } = getProperties(qosItem, 'qosSourceFile', 'qos');
      try {
        qosManager.removeQosRequirement(qosRequirement);
      } finally {
        try {
          this.updateData();
          if (file && get(file, 'hardlinksCount') > 1) {
            fileManager.fileParentRefresh(file);
          }
          if (file && get(file, 'type') === 'dir') {
            fileManager.dirChildrenRefresh(get(file, 'entityId'));
          }
        } catch (updateError) {
          console.error(
            'component:qosModal#removeQosRequirement: error updating data:',
            updateError
          );
        }
      }
    },
    evaluateQosExpression(expression) {
      return this.evaluateQosExpression(expression);
    },
    refreshQueryProperties() {
      return this.updateQueryPropertiesProxy({ replace: true });
    },
  },
});
