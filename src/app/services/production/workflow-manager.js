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
import { entityType as atmTaskExecutionEntityType } from 'oneprovider-gui/models/atm-task-execution';
import { allSettled } from 'rsvp';

export default Service.extend({
  store: service(),
  onedataGraph: service(),

  /**
   * @param {String} taskId
   * @param {Boolean} [fetchOptions.reload=false]
   * @returns {Promise<Models.AtmTaskExecution>}
   */
  async getAtmTaskExecutionById(taskId, { reload = false } = {}) {
    const taskGri = gri({
      entityType: atmTaskExecutionEntityType,
      entityId: taskId,
      aspect: 'instance',
      scope: 'private',
    });
    return await this.get('store').findRecord('atmTaskExecution', taskGri, { reload });
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

  async pushAtmWorkflowExecutionSummariesToStore(atmWorkflowExecutionSummariesAttrs) {
    const store = this.get('store');
    return atmWorkflowExecutionSummariesAttrs.map(atmWorkflowExecutionSummaryAttrs => {
      const modelData =
        store.normalize('atmWorkflowExecutionSummary', atmWorkflowExecutionSummaryAttrs);
      return store.push(modelData);
    });
  },
});
