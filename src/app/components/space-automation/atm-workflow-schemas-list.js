/**
 * Shows a list of all available workflow schemas (from all user inventories).
 *
 * @module components/space-automation/atm-workflow-schemas-list
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { promise } from 'ember-awesome-macros';
import { computed, get, getProperties } from '@ember/object';
import { sort } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import config from 'ember-get-config';
import { debounce } from '@ember/runloop';
import {
  getTargetStoreTypesForType,
  getTargetDataTypesForType,
  dataSpecToType,
} from 'onedata-gui-common/utils/workflow-visualiser/data-spec-converters';

const typingActionDebouce = config.timing.typingActionDebouce;

/**
 * @typedef {Object} AtmWorkflowSchemasListEntry
 * @property {Model.AtmWorkflowSchema} atmWorkflowSchema
 * @property {Boolean} hasMatchingInputStore
 * @property {String} name
 * @property {Boolean} isLoaded
 */

export default Component.extend(I18n, {
  classNames: ['atm-workflow-schemas-list'],

  i18n: service(),
  workflowManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceAutomation.atmWorkflowSchemasList',

  /**
   * @virtual optional
   * @type { dataSpec: Object, valuesCount: Number }
   */
  requiredInputStoreSpec: undefined,

  /**
   * @virtual
   * @type {(atmWorkflowSchema: Models.AtmWorkflowSchema, revisionNumber: number) => void}
   */
  onAtmWorkflowSchemaRevisionSelect: undefined,

  /**
   * @type {String}
   */
  searchValue: '',

  /**
   * @type {Array<String>}
   */
  listEntriesSorting: Object.freeze(['hasMatchingInputStore:desc', 'name']),

  /**
   * @type {ComputedProperty<PromiseArray<Models.AtmWorkflowSchema>>}
   */
  atmWorkflowSchemasProxy: promise.array(computed(function atmWorkflowSchemasProxy() {
    return this.get('workflowManager').getAllKnownAtmWorkflowSchemas();
  })),

  /**
   * @type {ComputedProperty<Array<AtmWorkflowSchemasListEntry>>}
   */
  listEntries: computed(
    'atmWorkflowSchemasProxy.content.@each.{stores,isLoaded,name}',
    'requiredInputStoreSpec',
    function listEntries() {
      const {
        atmWorkflowSchemasProxy,
        requiredInputStoreSpec,
      } = this.getProperties('atmWorkflowSchemasProxy', 'requiredInputStoreSpec');

      return (get(atmWorkflowSchemasProxy, 'content') || []).map(atmWorkflowSchema => {
        return Object.assign({
          atmWorkflowSchema,
          hasMatchingInputStore: this.hasMatchingInputStore(
            atmWorkflowSchema,
            requiredInputStoreSpec
          ),
        }, getProperties(atmWorkflowSchema, 'name', 'isLoaded'));
      });
    }
  ),

  /**
   * @type {ComputedProperty<Array<AtmWorkflowSchemasListEntry>>}
   */
  filteredListEntries: computed(
    'searchValue',
    'listEntries.@each.{name,isLoaded}',
    function filteredListEntries() {
      const {
        listEntries,
        searchValue,
      } = this.getProperties('listEntries', 'searchValue');
      const normalizedSearchValue = searchValue.trim().toLowerCase();

      return listEntries.filter(({ name, isLoaded }) => {
        if (!isLoaded) {
          return false;
        }
        const normalizedName = (name || '').trim().toLowerCase();
        return normalizedName.includes(normalizedSearchValue);
      });
    }
  ),

  /**
   * @type {ComputedProperty<Array<AtmWorkflowSchemasListEntry>>}
   */
  sortedListEntries: sort(
    'filteredListEntries',
    'listEntriesSorting'
  ),

  /**
   * This computed has no dependecies, because we need to wait only for the first fetch.
   * User will never change, additional inventories and workflows will be added on-the-fly.
   * @type {ComputedProperty<PromiseObject>}
   */
  dataLoadingProxy: computed(function dataLoadingProxy() {
    return this.get('atmWorkflowSchemasProxy');
  }),

  hasMatchingInputStore(atmWorkflowSchema, requiredInputStoreSpec) {
    if (!requiredInputStoreSpec) {
      return true;
    }
    const requiredDataType = dataSpecToType(requiredInputStoreSpec.dataSpec);
    const targetStoreTypes = getTargetStoreTypesForType(
      requiredDataType,
      requiredInputStoreSpec.valuesCount > 1
    );
    const targetDataTypes = getTargetDataTypesForType(requiredDataType);
    const stores = get(atmWorkflowSchema || {}, 'stores') || [];
    return stores.some(store => {
      const storeType = get(store, 'type');
      const storeDataType = dataSpecToType(get(store, 'dataSpec'));
      return targetStoreTypes.includes(storeType) &&
        targetDataTypes.includes(storeDataType);
    });
  },

  actions: {
    changeSearchValue(newValue) {
      debounce(this, 'set', 'searchValue', newValue, typingActionDebouce);
    },
  },
});
