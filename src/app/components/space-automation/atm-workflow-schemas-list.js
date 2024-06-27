/**
 * Shows a list of all available workflow schemas (from all user inventories).
 *
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import EmberObject, { computed, get } from '@ember/object';
import { reads, sort, gt } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/i18n';
import { inject as service } from '@ember/service';
import config from 'ember-get-config';
import { debounce } from '@ember/runloop';
import { doesDataSpecFitToStoreWrite } from 'onedata-gui-common/utils/atm-workflow/store-config';

const typingActionDebouce = config.timing.typingActionDebouce;

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
   * @type {(atmWorkflowSchema: Models.AtmWorkflowSchema, revisionNumber: RevisionNumber) => void}
   */
  onAtmWorkflowSchemaRevisionSelect: undefined,

  /**
   * @type {String}
   */
  searchValue: '',

  /**
   * @type {Array<String>}
   */
  listEntriesSorting: Object.freeze([
    'hasRevisionMatchingInput:desc',
    'name',
    'globalConflictLabel',
  ]),

  /**
   * @type {ComputedProperty<DestroyablePromiseArray<Models.AtmWorkflowSchema>>}
   */
  atmWorkflowSchemasProxy: computed(function atmWorkflowSchemasProxy() {
    return this.workflowManager.getAllKnownAtmWorkflowSchemas();
  }),

  /**
   * @type {ComputedProperty<Array<AtmWorkflowSchemasListEntry>>}
   */
  listEntries: computed(
    'atmWorkflowSchemasProxy.content.@each.{revisionRegistry,isCompatible}',
    'requiredInputStoreSpec',
    function listEntries() {
      const {
        atmWorkflowSchemasProxy,
        requiredInputStoreSpec,
      } = this.getProperties('atmWorkflowSchemasProxy', 'requiredInputStoreSpec');

      return (get(atmWorkflowSchemasProxy, 'content') || []).map(atmWorkflowSchema => {
        const revisionNumbersMatchingInput = this.getMatchingRevisionNumbers(
          atmWorkflowSchema,
          requiredInputStoreSpec
        );
        return AtmWorkflowSchemasListEntry.create({
          atmWorkflowSchema,
          revisionNumbersMatchingInput,
        });
      });
    }
  ),

  /**
   * @type {ComputedProperty<Array<AtmWorkflowSchemasListEntry>>}
   */
  filteredListEntries: computed(
    'searchValue',
    'listEntries.@each.{name,summary,collectedDescriptions,atmInventoryName,isLoaded}',
    function filteredListEntries() {
      const {
        listEntries,
        searchValue,
      } = this.getProperties('listEntries', 'searchValue');
      const normalizedSearchValue = searchValue.trim().toLowerCase();

      return listEntries.filter(({
        name,
        summary,
        collectedDescriptions,
        atmInventoryName,
        isLoaded,
      }) => {
        if (!isLoaded) {
          return false;
        }
        const stringsToSearchIn = [
          name,
          summary,
          ...collectedDescriptions,
          atmInventoryName,
        ].filter(Boolean).map((str) => str.trim().toLowerCase());
        return stringsToSearchIn.some((str) => str.includes(normalizedSearchValue));
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
   * This computed has no dependencies, because we need to wait only for the first fetch.
   * User will never change, additional inventories and workflows will be added on-the-fly.
   * @type {ComputedProperty<PromiseObject>}
   */
  dataLoadingProxy: computed(function dataLoadingProxy() {
    return this.get('atmWorkflowSchemasProxy');
  }),

  getMatchingRevisionNumbers(atmWorkflowSchema, requiredInputStoreSpec) {
    if (!get(atmWorkflowSchema, 'isCompatible')) {
      return [];
    }

    const revisionRegistry = get(atmWorkflowSchema, 'revisionRegistry') || {};
    const allRevisionNumbers = Object.keys(revisionRegistry).map(key => parseInt(key));
    if (!requiredInputStoreSpec?.dataSpec) {
      return allRevisionNumbers;
    }
    return allRevisionNumbers.filter(revisionNumber => {
      const stores = get(revisionRegistry[revisionNumber] || {}, 'stores') || [];
      const inputStores = stores.filterBy('requiresInitialContent');
      return inputStores.some(store =>
        doesDataSpecFitToStoreWrite(requiredInputStoreSpec.dataSpec, store)
      );
    });
  },

  /**
   * @override
   */
  willDestroy() {
    try {
      this.cacheFor('atmWorkflowSchemasProxy')?.destroy();
    } finally {
      this._super(...arguments);
    }
  },

  actions: {
    changeSearchValue(newValue) {
      debounce(this, 'set', 'searchValue', newValue, typingActionDebouce);
    },
  },
});

const AtmWorkflowSchemasListEntry = EmberObject.extend({
  /**
   * @virtual
   * @type {Model.AtmWorkflowSchema}
   */
  atmWorkflowSchema: undefined,

  /**
   * @virtual
   * @type {RevisionNumber[]}
   */
  revisionNumbersMatchingInput: undefined,

  /**
   * @type {ComputedProperty<string>}
   */
  name: reads('atmWorkflowSchema.name'),

  /**
   * @type {ComputedProperty<string | undefined>}
   */
  globalConflictLabel: reads('atmWorkflowSchema.globalConflictLabel'),

  /**
   * @type {ComputedProperty<string>}
   */
  summary: reads('atmWorkflowSchema.summary'),

  /**
   * @type {ComputedProperty<Array<string>>}
   */
  collectedDescriptions: computed(
    'atmWorkflowSchema.revisionRegistry',
    function collectedDescriptions() {
      return Object.values(this.get('atmWorkflowSchema.revisionRegistry') ?? {})
        .map((revision) => revision?.description || undefined)
        .filter(Boolean);
    }
  ),

  /**
   * @type {ComputedProperty<string | undefined>}
   */
  atmInventoryName: reads('atmWorkflowSchema.atmInventory.name'),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isLoaded: reads('atmWorkflowSchema.isLoaded'),

  /**
   * @type {ComputedProperty<boolean>}
   */
  hasRevisionMatchingInput: gt('revisionNumbersMatchingInput.length', 0),
});
