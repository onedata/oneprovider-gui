/**
 * Real implementation of workflow execution statistics fetcher.
 *
 * @module utils/workflow-visualiser/execution-data-fetcher
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import ExecutionDataFetcher from 'onedata-gui-common/utils/workflow-visualiser/execution-data-fetcher';
import { get, getProperties, computed } from '@ember/object';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { inject as service } from '@ember/service';
import _ from 'lodash';
import { all as allFulfilled } from 'rsvp';
import { normalizeWorkflowStatus } from 'onedata-gui-common/utils/workflow-visualiser/statuses';

const notFoundError = { id: 'notFound' };

export default ExecutionDataFetcher.extend(OwnerInjector, {
  workflowManager: service(),

  /**
   * @virtual
   * @type {Models.AtmWorkflowExecution}
   */
  atmWorkflowExecution: undefined,

  /**
   * @type {ComputedProperty<Object>}
   */
  taskRegistry: computed(
    'atmWorkflowExecution.lanes',
    function globalTaskRegistry() {
      const lanes = this.get('atmWorkflowExecution.lanes');
      const parallelBoxes = _.flatten(lanes.mapBy('parallelBoxes'));
      return parallelBoxes.mapBy('taskRegistry')
        .reduce((gtr, tr) => Object.assign(gtr, tr), {});
    }
  ),

  /**
   * @override
   */
  async fetchStatuses() {
    const {
      atmWorkflowExecution,
      workflowManager,
    } = this.getProperties('atmWorkflowExecution', 'workflowManager');
    await atmWorkflowExecution.reload();

    const lanes = get(atmWorkflowExecution, 'lanes');
    const parallelBoxes = _.flatten(lanes.mapBy('parallelBoxes'));
    const taskIds = Object.values(this.get('taskRegistry'));
    const taskExecutionRecords = await allFulfilled(taskIds.map(taskId =>
      workflowManager.getAtmTaskExecutionById(taskId, { reload: true })
    ));

    return {
      global: {
        status: normalizeWorkflowStatus(get(atmWorkflowExecution, 'status')),
      },
      lane: lanes.reduce((laneStatuses, { schemaId, status }) => {
        laneStatuses[schemaId] = { status };
        return laneStatuses;
      }, {}),
      parallelBox: parallelBoxes.reduce((parallelBoxStatuses, { schemaId, status }) => {
        parallelBoxStatuses[schemaId] = { status };
        return parallelBoxStatuses;
      }, {}),
      task: taskExecutionRecords.reduce((taskStatuses, taskExecutionRecord) => {
        taskStatuses[get(taskExecutionRecord, 'schemaId')] = getProperties(
          taskExecutionRecord,
          'status',
          'itemsInProcessing',
          'itemsProcessed',
          'itemsFailed'
        );
        return taskStatuses;
      }, {}),
    };
  },

  /**
   * @override
   */
  async fetchStoreContent(storeSchemaId, startFromIndex, limit, offset) {
    const storeRegistry = this.get('atmWorkflowExecution.storeRegistry');
    const storeInstanceId = storeRegistry && storeRegistry[storeSchemaId];

    if (!storeSchemaId) {
      throw notFoundError;
    }

    return await this.fetchStoreInstanceContent(
      storeInstanceId,
      startFromIndex,
      limit,
      offset
    );
  },

  /**
   * @override
   */
  async fetchTaskAuditLogContent(taskSchemaId, startFromIndex, limit, offset) {
    const {
      taskRegistry,
      workflowManager,
    } = this.getProperties('taskRegistry', 'workflowManager');
    const taskExecutionId = taskRegistry[taskSchemaId];
    if (!taskExecutionId) {
      throw notFoundError;
    }

    const taskExecutionRecord =
      await workflowManager.getAtmTaskExecutionById(taskExecutionId);
    const auditLogStoreId = get(taskExecutionRecord, 'auditLogStoreId');

    return await this.fetchStoreInstanceContent(
      auditLogStoreId,
      startFromIndex,
      limit,
      offset
    );
  },

  /**
   * @param {String} storeInstanceId
   * @param {String} startFromIndex
   * @param {number} limit
   * @param {number} offset
   * @returns {Promise<{array: Array<StoreContentEntry>, isLast: Boolean}>}
   */
  async fetchStoreInstanceContent(storeInstanceId, startFromIndex, limit, offset) {
    return await this.get('workflowManager')
      .getStoreContent(storeInstanceId, startFromIndex, limit, offset);
  },
});
