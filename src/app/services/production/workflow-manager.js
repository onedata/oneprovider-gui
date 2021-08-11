/**
 * Provides backend functions related to workflows and inventories.
 *
 * @module services/workflow-manager
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { getProperties } from '@ember/object';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { entityType as atmWorkflowSchemaEntityType } from 'oneprovider-gui/models/atm-workflow-schema';
import { entityType as atmWorkflowExecutionEntityType } from 'oneprovider-gui/models/atm-workflow-execution';
import { entityType as atmTaskExecutionEntityType } from 'oneprovider-gui/models/atm-task-execution';
import { allSettled } from 'rsvp';
import { reads } from '@ember/object/computed';
import { bool, and } from 'ember-awesome-macros';
import { promiseArray } from 'onedata-gui-common/utils/ember/promise-array';
import AllKnownAtmWorkflowSchemasProxyArray from 'oneprovider-gui/utils/workflow-manager/all-known-atm-workflow-schemas-proxy-array';

export default Service.extend({
  store: service(),
  onedataGraph: service(),
  onedataConnection: service(),
  currentUser: service(),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isOpenfaasAvailable: bool('onedataConnection.openfaasAvailable'),

  /**
   * @type {ComputedProperty<String|undefined>}
   */
  bagitUploaderWorkflowSchemaId: reads('onedataConnection.bagitUploaderWorkflowSchemaId'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isBagitUploaderAvailable: and('isOpenfaasAvailable', 'bagitUploaderWorkflowSchemaId'),

  /**
   * @param {String} atmWorkflowSchemaId
   * @returns {Promise<Models.AtmWorkflowSchema>}
   */
  async getAtmWorkflowSchemaById(atmWorkflowSchemaId) {
    const atmWorkflowExecutionGri = gri({
      entityType: atmWorkflowSchemaEntityType,
      entityId: atmWorkflowSchemaId,
      aspect: 'instance',
      scope: 'private',
    });
    return await this.get('store')
      .findRecord('atmWorkflowSchema', atmWorkflowExecutionGri);
  },

  /**
   * @param {String} atmWorkflowExecutionId
   * @returns {Promise<Models.AtmWorkflowExecution>}
   */
  async getAtmWorkflowExecutionById(atmWorkflowExecutionId) {
    const atmWorkflowExecutionGri = gri({
      entityType: atmWorkflowExecutionEntityType,
      entityId: atmWorkflowExecutionId,
      aspect: 'instance',
      scope: 'private',
    });
    return await this.get('store')
      .findRecord('atmWorkflowExecution', atmWorkflowExecutionGri);
  },

  /**
   * @param {String} taskId
   * @param {Boolean} [fetchOptions.reload=false]
   * @returns {Promise<Models.AtmTaskExecution>}
   */
  async getAtmTaskExecutionById(taskId, {
    reload = false,
    backgroundReload = false,
  } = {}) {
    const taskGri = gri({
      entityType: atmTaskExecutionEntityType,
      entityId: taskId,
      aspect: 'instance',
      scope: 'private',
    });
    return await this.get('store')
      .findRecord('atmTaskExecution', taskGri, { reload, backgroundReload });
  },

  /**
   * @param {String} atmWorkflowSchemaId
   * @param {String} spaceId
   * @param {Object} storeInitialValues map (storeSchemaId => initial value)
   * @returns {Promise<Models.AtmWorkflowExecution>}
   */
  async runWorkflow(atmWorkflowSchemaId, spaceId, storeInitialValues) {
    return await this.get('store').createRecord('atmWorkflowExecution', {
      _meta: {
        additionalData: {
          atmWorkflowSchemaId,
          spaceId,
          storeInitialValues,
        },
      },
    }).save();
  },

  async cancelAtmWorkflowExecution(atmWorkflowExecutionId) {
    const cancelGri = gri({
      entityType: atmWorkflowExecutionEntityType,
      entityId: atmWorkflowExecutionId,
      aspect: 'cancel',
      scope: 'private',
    });
    await this.get('onedataGraph').request({
      gri: cancelGri,
      operation: 'create',
      subscribe: false,
    });
  },

  /**
   * @param {Models.Space} space
   * @param {String} phase one of: `'waiting'`, `'ongoing'`, `'ended'`
   * @param {String} startFromIndex
   * @param {number} limit
   * @param {number} offset
   * @returns {Promise<{array: Array<Models.AtmWorkflowExecutionSummary>, isLast: Boolean}>}
   */
  async getAtmWorkflowExecutionSummariesForSpace(
    space, phase, startFromIndex, limit, offset
  ) {
    if (!limit || limit <= 0) {
      return { array: [], isLast: false };
    }

    const onedataGraph = this.get('onedataGraph');
    const {
      entityType,
      entityId,
    } = getProperties(space, 'entityType', 'entityId');
    const atmWorkflowExecutionSummariesGri = gri({
      entityType,
      entityId,
      aspect: 'atm_workflow_execution_summaries',
    });
    const { list, isLast } = await onedataGraph.request({
      gri: atmWorkflowExecutionSummariesGri,
      operation: 'get',
      data: {
        phase,
        index: startFromIndex,
        offset,
        limit,
      },
      subscribe: false,
    });
    const atmWorkflowExecutionSummaries =
      await this.pushAtmWorkflowExecutionSummariesToStore(list);
    await allSettled(atmWorkflowExecutionSummaries.mapBy('atmInventory'));
    return { array: atmWorkflowExecutionSummaries, isLast };
  },

  /**
   * @param {String} storeInstanceId
   * @param {String} startFromIndex
   * @param {number} limit
   * @param {number} offset
   * @returns {Promise<{array: Array<StoreContentEntry>, isLast: Boolean}>}
   */
  async getStoreContent(storeInstanceId, startFromIndex, limit, offset) {
    if (!limit || limit <= 0) {
      return { array: [], isLast: false };
    }

    const onedataGraph = this.get('onedataGraph');
    const storeContentGri = gri({
      entityType: 'op_atm_store',
      entityId: storeInstanceId,
      aspect: 'content',
    });
    const { list, isLast } = await onedataGraph.request({
      gri: storeContentGri,
      operation: 'get',
      data: {
        index: startFromIndex,
        offset,
        limit,
      },
      subscribe: false,
    });

    return { array: list, isLast };
  },

  /**
   * @returns {PromiseArray<Models.AtmWorkflowSchema>}
   */
  getAllKnownAtmWorkflowSchemas() {
    return promiseArray(
      this.get('currentUser').getCurrentUserRecord().then(user => {
        const knownAtmWorkflowSchemasProxy =
          AllKnownAtmWorkflowSchemasProxyArray.create({ user });
        return knownAtmWorkflowSchemasProxy.initAsync()
          .then(() => knownAtmWorkflowSchemasProxy);
      })
    );
  },

  async pushAtmWorkflowExecutionSummariesToStore(atmWorkflowExecutionSummariesAttrs) {
    const store = this.get('store');
    return atmWorkflowExecutionSummariesAttrs.map(atmWorkflowExecutionSummaryAttrs => {
      const modelData =
        store.normalize('atmWorkflowExecutionSummary', atmWorkflowExecutionSummaryAttrs);
      return store.push(modelData);
    });
  },
});
