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
import { computed, get } from '@ember/object';
import { sort } from '@ember/object/computed';
import onlyFulfilledValues from 'onedata-gui-common/utils/only-fulfilled-values';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  classNames: ['atm-workflow-schemas-list'],

  i18n: service(),

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
   * @type {Function}
   * @param {Models.AtmWorkflowSchema} selectedAtmWorkflowSchema
   * @returns {any}
   */
  onAtmWorkflowSchemaSelect: notImplementedIgnore,

  /**
   * @type {Array<String>}
   */
  atmWorkflowSchemasSorting: Object.freeze(['name']),

  /**
   * @type {Array<Models.AtmWorkflowSchema>}
   */
  atmWorkflowSchemas: computedLastProxyContent('atmWorkflowSchemasProxy'),

  /**
   * @type {ComputedProperty<PromiseArray<Models.AtmInventory>>}
   */
  atmInventoriesProxy: promise.array(
    computed('user', async function atmInventoriesProxy() {
      const effAtmInventoryList = await this.get('user.effAtmInventoryList');
      try {
        return await get(effAtmInventoryList, 'list');
      } catch (error) {
        // Passing inventories, which were fetched without error
        return get(effAtmInventoryList, 'list.content');
      }
    })
  ),

  /**
   * @type {ComputedProperty<PromiseArray<DS.RecordArray<Models.AtmWorkflowSchema>>>}
   */
  atmWorkflowSchemaListsProxy: promise.array(computed(
    'atmInventoriesProxy.@each.isReloading',
    async function atmWorkflowSchemaListsProxy() {
      const atmInventories = await this.get('atmInventoriesProxy');
      const atmWorkflowSchemaLists = await onlyFulfilledValues(
        atmInventories.mapBy('atmWorkflowSchemaList')
      );
      return await onlyFulfilledValues(atmWorkflowSchemaLists.compact().mapBy('list'));
    }
  )),

  /**
   * @type {ComputedProperty<PromiseArray<Models.AtmWorkflowSchema>>}
   */
  atmWorkflowSchemasProxy: promise.array(computed(
    'atmWorkflowSchemaListsProxy.@each.isReloading',
    async function atmWorkflowSchemasProxy() {
      const atmWorkflowSchemaLists = await this.get('atmWorkflowSchemaListsProxy');
      const workflowsArray = [];
      atmWorkflowSchemaLists.forEach(list => workflowsArray.push(...list.toArray()));
      return workflowsArray;
    }
  )),

  /**
   * @type {ComputedProperty<Array<Model.AtmWorkflowSchema>>}
   */
  sortedAtmWorkflowSchemas: sort('atmWorkflowSchemas', 'atmWorkflowSchemasSorting'),

  /**
   * This computed has no dependecies, because we need to wait only for the first fetch.
   * User will never change, additional inventories and workflows will be added on-the-fly.
   * @type {ComputedProperty<PromiseObject>}
   */
  dataLoadingProxy: computed(function dataLoadingProxy() {
    return this.get('atmWorkflowSchemasProxy');
  }),

  actions: {
    atmWorkflowSchemaSelected(atmWorkflowSchema) {
      const onAtmWorkflowSchemaSelect = this.get('onAtmWorkflowSchemaSelect');
      onAtmWorkflowSchemaSelect && onAtmWorkflowSchemaSelect(atmWorkflowSchema);
    },
  },
});
