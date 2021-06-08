import Component from '@ember/component';
import { promise } from 'ember-awesome-macros';
import { computed, get, getProperties, observer } from '@ember/object';
import { sort } from '@ember/object/computed';
import onlyFulfilledValues from 'onedata-gui-common/utils/only-fulfilled-values';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default Component.extend({
  classNames: ['atm-workflow-schemas-list'],

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
  atmWorkflowSchemas: undefined,

  /**
   * @type {ComputedProperty<PromiseArray<Models.AtmInventory>>}
   */
  atmInventoriesProxy: promise.array(
    computed('user', async function atmInventoriesProxy() {
      return await get(await get(this.get('user'), 'atmInventoryList'), 'list');
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

  atmWorkflowSchemasProxyObserver: observer(
    'atmWorkflowSchemasProxy.[]',
    function atmWorkflowSchemasProxyObserver() {
      const {
        isFulfilled,
        content,
      } = getProperties(
        this.get('atmWorkflowSchemasProxy'),
        'isFulfilled',
        'content'
      );

      if (isFulfilled) {
        this.set('atmWorkflowSchemas', content);
      }
    }
  ),

  actions: {
    atmWorkflowSchemaSelected(atmWorkflowSchema) {
      const onAtmWorkflowSchemaSelect = this.get('onAtmWorkflowSchemaSelect');
      onAtmWorkflowSchemaSelect && onAtmWorkflowSchemaSelect(atmWorkflowSchema);
    },
  },
});
