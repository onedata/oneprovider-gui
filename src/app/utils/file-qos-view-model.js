/**
 * Model and logic for file-qos components
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { get, setProperties, getProperties, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import createQosParametersSuggestions from 'oneprovider-gui/utils/create-qos-parameters-suggestions';
import { Promise, all as allFulfilled, allSettled } from 'rsvp';
import QueryValueComponentsBuilderQos from 'oneprovider-gui/utils/query-value-components-builder-qos';
import { raw, array, promise, gt, or, not, eq } from 'ember-awesome-macros';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

const mixins = [
  OwnerInjector,
  I18n,
  createDataProxyMixin('queryProperties'),
  createDataProxyMixin('storages'),
  createDataProxyMixin('providers'),
];

export const qosStatusIcons = {
  error: 'warning',
  empty: 'circle-not-available',
  fulfilled: 'checkbox-filled',
  pending: 'checkbox-pending',
  impossible: 'checkbox-filled-warning',
};

export default EmberObject.extend(...mixins, {
  i18n: service(),
  spaceManager: service(),
  qosManager: service(),
  fileManager: service(),
  globalNotify: service(),
  modalManager: service(),

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
   * @virtual
   * @type {Utils.FilesQosStatusModel}
   */
  filesQosStatusModel: undefined,

  /**
   * @virtul optional
   * @type {() => void}
   */
  onClose: notImplementedIgnore,

  //#region state

  /**
   * @type {'list'|'creator'}
   */
  activeSlideId: 'list',

  /**
   * Object containing data required to create neq Models.QosRequirement
   * @type { { replicasNumber: Number, expressionInfix: Array<String> } }
   */
  newEntryData: undefined,

  /**
   * @type {boolean}
   */
  newEntryIsValid: undefined,

  //#endregion

  /**
   * Data required for showing list/empty screen of QoS requirements.
   * Note: no computed property dependencies, because it is only first-time load proxy.
   * @type {ComputedProperty<Promise<Array>>}
   */
  initialDataProxy: promise.object(computed(async function initialDataProxy() {
    return await allFulfilled([
      this.noQosRequirementsProxy,
      this.queryPropertiesProxy,
      this.storagesProxy,
      this.providersProxy,
    ]);
  })),

  isFooterHidden: or(
    not('initialDataProxy.isFulfilled'),
    'noQosRequirements',
    eq('activeSlideId', raw('add'))
  ),

  spaceId: reads('space.entityId'),

  summaryProxies: array.mapBy('files', raw('fileQosSummary')),

  /**
   * Resolves to true if there is no QoS requirement in any file.
   * @type {ComputedProperty<PromiseObject<boolean>>}
   */
  noQosRequirementsProxy: promise.object(computed(
    'summaryProxies.@each.requirements',
    async function noQosRequirementsProxy() {
      const summaries = await allFulfilled(this.summaryProxies);
      return !summaries.some(summary =>
        Object.keys(get(summary, 'requirements')).length
      );
    }
  )),

  noQosRequirements: reads('noQosRequirementsProxy.content'),

  isAddDisabled: not('editPrivilege'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isSaveDisabled: or(not('newEntryIsValid'), 'isAddDisabled'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  editPrivilege: reads('space.privileges.manageQos'),

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

  fileItems: reads('filesQosStatusModel.fileItems'),

  /**
   * @type {ComputedProperty<QueryValueComponentsBuilder>}
   */
  valuesBuilder: computed('', () => QueryValueComponentsBuilderQos.create()),

  isAddDisabledTip: computed('editPrivilege', function isAddDisabledTip() {
    if (!this.editPrivilege) {
      return insufficientPrivilegesMessage({
        i18n: this.get('i18n'),
        modelName: 'space',
        privilegeFlag: 'space_manage_qos',
      });
    }
  }),

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

  async updateData() {
    return await this.filesQosStatusModel.updateData();
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
   * @param {Utils.QosItem} qosItem
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
      await qosManager.removeQosRequirement(qosRequirement);
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

  openQosRequirementCreator() {
    this.changeSlide('add');
  },

  closeQosRequirementCreator() {
    this.changeSlide('list');
    this.setProperties({
      newEntryData: null,
      newEntryIsValid: false,
    });
  },

  changeSlide(slideId) {
    this.set('activeSlideId', slideId);
  },

  changeNewEntry(data, isValid) {
    if (data !== undefined) {
      this.set('newEntryData', data);
    }
    if (isValid !== undefined) {
      this.set('newEntryIsValid', isValid);
    }
  },

  refreshQueryProperties() {
    return this.updateQueryPropertiesProxy({ replace: true });
  },

  saveNewEntry() {
    if (this.isSaveDisabled) {
      return;
    }
    return this.addEntry(this.newEntryData);
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
        this.closeQosRequirementCreator();
        return updating;
      });
  },

  /**
   * If needed, show unsaved changes prompt with save/restore actions.
   * @returns {Promise<boolean>} If `true` is returned, the tab can be safely closed.
   *   If `false` is returned, you should not close the tab due to unsaved changes.
   */
  async checkClose() {
    if (this.activeSlideId === 'add' && this.newEntryData) {
      return await this.handleUnsavedChanges();
    } else {
      return true;
    }
  },

  /**
   * @returns {Promise<boolean>} true if current tab can be closed
   */
  async handleUnsavedChanges() {
    return await new Promise(resolve => {
      this.modalManager.show('unsaved-changes-question-modal', {
        onSubmit: async (data) => {
          if (data.shouldSaveChanges) {
            try {
              await this.saveNewEntry();
              this.closeQosRequirementCreator();
              resolve(true);
            } catch (error) {
              resolve(false);
            }
          } else {
            this.closeQosRequirementCreator();
            resolve(true);
          }
        },
        onHide() {
          resolve(false);
        },
      });
    });
  },
});
