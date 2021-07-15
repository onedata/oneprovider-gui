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
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import config from 'ember-get-config';
import { debounce } from '@ember/runloop';

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
   * @virtual
   * @type {Models.User}
   */
  user: undefined,

  /**
   * @virtual
   * @type {Function}
   * @param {Models.AtmWorkflowSchema} selectedAtmWorkflowSchema
   * @returns {any}
   */
  onAtmWorkflowSchemaSelect: notImplementedIgnore,

  /**
   * @type {String}
   */
  searchValue: '',

  /**
   * @type {Array<String>}
   */
  atmWorkflowSchemasSorting: Object.freeze(['name']),

  /**
   * @type {ComputedProperty<PromiseArray<Models.AtmWorkflowSchema>>}
   */
  atmWorkflowSchemasProxy: promise.array(computed(function atmWorkflowSchemasProxy() {
    return this.get('workflowManager').getAllKnownAtmWorkflowSchemas();
  })),

  /**
   * @type {ComputedProperty<Array<Models.AtmWorkflowSchema>>}
   */
  filteredAtmWorkflowSchemas: computed(
    'searchValue',
    'atmWorkflowSchemasProxy.content.@each.{name,isLoaded}',
    function filteredAtmWorkflowSchemas() {
      const {
        atmWorkflowSchemasProxy,
        searchValue,
      } = this.getProperties('atmWorkflowSchemasProxy', 'searchValue');
      const normalizedSearchValue = searchValue.trim().toLowerCase();

      return (get(atmWorkflowSchemasProxy, 'content') || []).filter(atmWorkflowSchema => {
        const {
          isLoaded,
          name,
        } = getProperties(atmWorkflowSchema, 'isLoaded', 'name');
        if (!isLoaded) {
          return false;
        }
        const normalizedName = (name || '').trim().toLowerCase();
        return normalizedName.includes(normalizedSearchValue);
      });
    }
  ),

  /**
   * @type {ComputedProperty<Array<Model.AtmWorkflowSchema>>}
   */
  sortedAtmWorkflowSchemas: sort(
    'filteredAtmWorkflowSchemas',
    'atmWorkflowSchemasSorting'
  ),

  /**
   * This computed has no dependecies, because we need to wait only for the first fetch.
   * User will never change, additional inventories and workflows will be added on-the-fly.
   * @type {ComputedProperty<PromiseObject>}
   */
  dataLoadingProxy: computed(function dataLoadingProxy() {
    return this.get('atmWorkflowSchemasProxy');
  }),

  actions: {
    changeSearchValue(newValue) {
      debounce(this, 'set', 'searchValue', newValue, typingActionDebouce);
    },
    atmWorkflowSchemaSelected(atmWorkflowSchema) {
      const onAtmWorkflowSchemaSelect = this.get('onAtmWorkflowSchemaSelect');
      onAtmWorkflowSchemaSelect && onAtmWorkflowSchemaSelect(atmWorkflowSchema);
    },
  },
});
