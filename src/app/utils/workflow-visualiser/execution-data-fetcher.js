/**
 * Real implementation of workflow execution data fetcher.
 *
 * @module utils/workflow-visualiser/execution-data-fetcher
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import ExecutionDataFetcher from 'onedata-gui-common/utils/workflow-visualiser/execution-data-fetcher';
import { get, getProperties, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { inject as service } from '@ember/service';
import _ from 'lodash';
import { hash } from 'rsvp';
import { normalizeWorkflowStatus } from 'onedata-gui-common/utils/workflow-visualiser/statuses';
import { promise } from 'ember-awesome-macros';

const notFoundError = { id: 'notFound' };
const emptyStoreContent = { array: [], isLast: true };

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
  storeRegistry: reads('atmWorkflowExecution.storeRegistry'),

  /**
   * @type {ComputedProperty<Object>}
   */
  taskRegistry: computed(
    'atmWorkflowExecution.lanes',
    function taskRegistry() {
      const lanes = this.get('atmWorkflowExecution.lanes');
      const parallelBoxes = _.flatten(lanes.mapBy('parallelBoxes'));
      return parallelBoxes.mapBy('taskRegistry')
        .reduce((gtr, tr) => Object.assign(gtr, tr), {});
    }
  ),

  /**
   * @type {ComputedProperty<PromiseObject<Object>>}
   */
  instanceIdsMappingProxy: promise.object(computed(
    'atmWorkflowExecution.{entityId,systemAuditLogId}',
    'storeRegistry',
    'taskRegistry',
    async function instanceIdsMappingProxy() {
      const taskExecutionRecords = await this.fetchTaskExecutionRecords();
      const taskSystemAuditLog = Object.keys(taskExecutionRecords)
        .reduce((storeIdsMap, taskSchemaId) => {
          storeIdsMap[taskSchemaId] =
            get(taskExecutionRecords, `${taskSchemaId}.systemAuditLogId`);
          return storeIdsMap;
        }, {});

      return {
        workflow: this.get('atmWorkflowExecution.entityId'),
        task: this.get('taskRegistry') || {},
        store: {
          global: this.get('storeRegistry') || {},
          taskSystemAuditLog,
          workflowSystemAuditLog: this.get('atmWorkflowExecution.systemAuditLogId'),
        },
      };
    }
  )),

  /**
   * @override
   */
  async fetchStatuses() {
    const atmWorkflowExecution = this.get('atmWorkflowExecution');
    await atmWorkflowExecution.reload();

    const lanes = get(atmWorkflowExecution, 'lanes');
    const parallelBoxes = _.flatten(lanes.mapBy('parallelBoxes'));
    const taskExecutionRecords = await this.fetchTaskExecutionRecords(true);

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
      task: Object.keys(taskExecutionRecords).reduce((taskStatuses, taskSchemaId) => {
        taskStatuses[taskSchemaId] = getProperties(
          get(taskExecutionRecords, taskSchemaId),
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
  async fetchInstanceIdsMapping() {
    return await this.get('instanceIdsMappingProxy');
  },

  /**
   * @override
   */
  async fetchStoreContent(storeSchemaId, startFromIndex, limit, offset) {
    const storeInstanceId = (this.get('storeRegistry') || {})[storeSchemaId];

    if (!storeInstanceId) {
      console.error(
        'util:workflow-visualiser/execution-data-fetcher#fetchStoreContent: invalid storeSchemaId',
      );
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
  async fetchWorkflowAuditLogContent(startFromIndex, limit, offset) {
    const auditLogStoreId = this.get('atmWorkflowExecution.systemAuditLogId');
    // Workflow executions from some alpha releases do not have auditLog stores attached.
    if (!auditLogStoreId) {
      return emptyStoreContent;
    }

    return await this.fetchStoreInstanceContent(
      auditLogStoreId,
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
      console.error(
        'util:workflow-visualiser/execution-data-fetcher#fetchTaskAuditLogContent: invalid taskSchemaId',
      );
      throw notFoundError;
    }

    const taskExecutionRecord =
      await workflowManager.getAtmTaskExecutionById(taskExecutionId);
    const auditLogStoreId = get(taskExecutionRecord, 'systemAuditLogId');
    // Task executions from some alpha releases do not have auditLog stores attached.
    if (!auditLogStoreId) {
      return emptyStoreContent;
    }

    return await this.fetchStoreInstanceContent(
      auditLogStoreId,
      startFromIndex,
      limit,
      offset
    );
  },

  /**
   * @private
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

  /**
   * @param {Boolean} [reload=false]
   * @returns {Promise<Object>} Key is task schema id, value is task execution record
   */
  async fetchTaskExecutionRecords(reload = false) {
    const {
      workflowManager,
      taskRegistry,
    } = this.getProperties('workflowManager', 'taskRegistry');
    return await hash(
      Object.keys(taskRegistry).reduce((promiseHash, taskSchemaId) => {
        const taskInstanceId = taskRegistry[taskSchemaId];
        promiseHash[taskSchemaId] =
          workflowManager.getAtmTaskExecutionById(taskInstanceId, { reload });
        return promiseHash;
      }, {})
    );
  },
});
