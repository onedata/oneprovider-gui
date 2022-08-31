/**
 * Model and logic for file-qos components
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { get, setProperties, getProperties, observer, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import createQosParametersSuggestions from 'oneprovider-gui/utils/create-qos-parameters-suggestions';
import { all as allFulfilled, allSettled } from 'rsvp';
import QosModalFileItem from 'oneprovider-gui/utils/qos-modal-file-item';
import QueryValueComponentsBuilderQos from 'oneprovider-gui/utils/query-value-components-builder-qos';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { conditional, raw, equal, and, getBy, array, promise, gt, or, not } from 'ember-awesome-macros';
import Looper from 'onedata-gui-common/utils/looper';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';

const mixins = [
  OwnerInjector,
  I18n,
  createDataProxyMixin('queryProperties'),
  createDataProxyMixin('storages'),
  createDataProxyMixin('providers'),
];

export default EmberObject.extend(...mixins, {
  i18n: service(),
  spaceManager: service(),
  qosManager: service,
  fileManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.fileQosViewModel',

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {Array<Models.File>}
   */
  files: undefined,

  /**
   * Initialized on init
   * @type {Looper}
   */
  updater: null,

  spaceId: reads('space.entityId'),

  /**
   * Data needed to show requirements list
   * @type {ComputedProperty<PromiseArray>}
   */
  dataProxy: promise.object(
    promise.all('queryPropertiesProxy', 'storagesProxy', 'providersProxy')
  ),

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
  multipleFiles: gt('files.length', 1),

  fileItems: computed('files.[]', function fileItems() {
    const filesSorted = [...this.get('files')].sortBy('name');
    return filesSorted.map(file => {
      return QosModalFileItem.create({
        ownerSource: this,
        file,
      });
    });
  }),

  /**
   * @type {ComputedProperty<QueryValueComponentsBuilder>}
   */
  valuesBuilder: computed(() => QueryValueComponentsBuilderQos.create()),

  init() {
    this._super(...arguments);
    // FIXME: updater
    // this.initUpdater();
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

  // FIXME: updater support
  // initUpdater() {
  //   const updater = Looper.create({
  //     immediate: true,
  //   });
  //   updater.on('tick', () => {
  //     this.updateData(true);
  //   });
  //   this.set('updater', updater);
  //   this.configureUpdater();
  // },

  async updateData(replace = false) {
    const fileItems = this.get('fileItems');
    try {
      await allFulfilled(fileItems.invoke('updateData', replace));
    } catch (error) {
      // FIXME: updater support
      // safeExec(this, 'set', 'updater.interval', null);
    }
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
          'removeQosRequirement: error updating data:',
          updateError
        );
      }
    }
  },

  evaluateQosExpression(expression) {
    const {
      spaceManager,
      spaceId,
    } = this.getProperties('spaceManager', 'spaceId');
    return spaceManager.evaluateQosExpression(spaceId, expression);
  },
});
