/**
 * Proxies access to all known workflow schemas, which are aggregated from all
 * user automation inventories.
 *
 * @module utils/workflow-manager/all-known-atm-workflow-schemas-proxy-array
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { getProperties, computed, observer, get } from '@ember/object';
import { promise } from 'ember-awesome-macros';
import ArrayProxy from '@ember/array/proxy';
import onlyFulfilledValues from 'onedata-gui-common/utils/only-fulfilled-values';

export default ArrayProxy.extend({
  /**
   * @virtual
   * @type {Models.User}
   */
  user: undefined,

  /**
   * @type {ComputedProperty<PromiseArray<Model.AtmInventory>>}
   */
  atmInventoriesProxy: promise.array(
    computed('user', async function atmInventoriesProxy() {
      const user = this.get('user');
      if (!user) {
        return [];
      }
      const atmInventoriesList = await get(user, 'effAtmInventoryList');
      return await get(atmInventoriesList, 'list');
    })
  ),

  /**
   * @type {ComputedProperty<PromiseArray<DS.RecordArray<Model.AtmWorkflowSchema>>>}
   */
  atmWorkflowSchemaListsProxy: promise.array(computed(
    'atmInventoriesProxy.@each.isReloading',
    async function atmWorkflowSchemasListsProxy() {
      const atmInventoriesProxy = await this.get('atmInventoriesProxy');
      const atmWorkflowSchemaLists = await onlyFulfilledValues(
        atmInventoriesProxy.mapBy('atmWorkflowSchemaList')
      );
      return await onlyFulfilledValues(atmWorkflowSchemaLists.compact().mapBy('list'));
    }
  )),

  /**
   * @type {ComputedProperty<PromiseArray<Model.AtmWorkflowSchema>>}
   */
  atmWorkflowSchemasProxy: promise.array(computed(
    'atmWorkflowSchemaListsProxy.@each.isReloading',
    async function atmWorkflowSchemasProxy() {
      const atmWorkflowSchemaListsProxy = await this.get('atmWorkflowSchemaListsProxy');
      const atmWorkflowSchemasArray = [];
      atmWorkflowSchemaListsProxy.forEach(list =>
        atmWorkflowSchemasArray.push(...list.toArray())
      );
      return atmWorkflowSchemasArray;
    }
  )),

  atmWorkflowSchemasProxyObserver: observer(
    'atmWorkflowSchemasProxy.[]',
    function atmWorkflowSchemasProxyObserver() {
      const {
        isFulfilled,
        content,
      } = getProperties(this.get('atmWorkflowSchemasProxy'), 'isFulfilled', 'content');

      if (isFulfilled) {
        this.set('content', content);
      }
    }
  ),

  async initAsync() {
    return await this.get('atmWorkflowSchemasProxy');
  },
});