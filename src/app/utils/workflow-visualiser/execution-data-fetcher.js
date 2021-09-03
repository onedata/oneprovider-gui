/**
 * Real implementation of workflow execution data fetcher.
 *
 * @module utils/workflow-visualiser/execution-data-fetcher
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import ExecutionDataFetcher from 'onedata-gui-common/utils/workflow-visualiser/execution-data-fetcher';
import { get, getProperties } from '@ember/object';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { inject as service } from '@ember/service';
import { taskEndedStatuses } from 'onedata-gui-common/utils/workflow-visualiser/statuses';

const notFoundError = { id: 'notFound' };

export default ExecutionDataFetcher.extend(OwnerInjector, {
  workflowManager: service(),

  /**
   * @virtual
   * @type {Models.AtmWorkflowExecution}
   */
  atmWorkflowExecution: undefined,

  /**
   * Mapping: (atmTaskExecutionInstanceId: string) -> Model.AtmTaskExecution
   * @type {Object}
   */
  atmTaskExecutionRecordsCache: undefined,

  /**
   * Mapping: (atmStoreInstanceId: string) -> Model.AtmStore
   * @type {Object}
   */
  atmStoreRecordsCache: undefined,

  init() {
    this._super(...arguments);

    this.setProperties({
      atmTaskExecutionRecordsCache: {},
      atmStoreRecordsCache: {},
    });
  },

  /**
   * @override
   */
  async fetchExecutionState() {
    await this.reloadAtmWorkflowExecution();

    const workflowExecutionState = this.getWorkflowExecutionState();
    const lanesExecutionState = this.getLanesExecutionState();
    const parallelBoxesExecutionState = this.getParallelBoxesExecutionState();
    const tasksExecutionState = await this.getTasksExecutionState();
    const storesExecutionState = await this.getStoresExecutionState({
      workflowExecutionState,
      lanesExecutionState,
      tasksExecutionState,
    });

    return {
      workflow: workflowExecutionState,
      lane: lanesExecutionState,
      parallelBox: parallelBoxesExecutionState,
      task: tasksExecutionState,
      store: storesExecutionState,
    };
  },

  /**
   * @override
   */
  async fetchStoreContent(storeInstanceId, startFromIndex, limit, offset) {
    if (!storeInstanceId) {
      console.error(
        'util:workflow-visualiser/execution-data-fetcher#fetchStoreContent: invalid storeSchemaId',
      );
      throw notFoundError;
    }

    return await this.get('workflowManager')
      .getStoreContent(storeInstanceId, startFromIndex, limit, offset);
  },

  async reloadAtmWorkflowExecution() {
    await this.get('atmWorkflowExecution').reload();
  },

  getWorkflowExecutionState() {
    const atmWorkflowExecution = this.get('atmWorkflowExecution');
    const {
      entityId: instanceId,
      systemAuditLogId,
      status,
    } = getProperties(
      atmWorkflowExecution,
      'entityId',
      'systemAuditLogId',
      'status'
    );

    return {
      instanceId,
      systemAuditLogStoreInstanceId: systemAuditLogId,
      status,
    };
  },

  getLanesExecutionState() {
    const lanesExecutionState = {};
    for (const lane of this.getAtmWorkflowExecutionLanes()) {
      const laneSchemaId = lane.schemaId;
      const runsState = {};
      for (const run of this.getLaneRuns(lane)) {
        runsState[run.runNo] = {
          runNo: run.runNo,
          sourceRunNo: run.sourceRunNo,
          iteratedStoreInstanceId: run.iteratedStoreId,
          status: run.status,
        };
      }

      lanesExecutionState[laneSchemaId] = {
        runs: runsState,
      };
    }

    return lanesExecutionState;
  },

  getParallelBoxesExecutionState() {
    const parallelBoxesExecutionState = {};
    for (const lane of this.getAtmWorkflowExecutionLanes()) {
      for (const run of this.getLaneRuns(lane)) {
        for (const parallelBox of this.getRunParallelBoxes(run)) {
          const parallelBoxSchemaId = parallelBox.schemaId;
          if (!(parallelBoxSchemaId in parallelBoxesExecutionState)) {
            parallelBoxesExecutionState[parallelBoxSchemaId] = {
              runs: {},
            };
          }

          parallelBoxesExecutionState[parallelBoxSchemaId].runs[run.runNo] = {
            runNo: run.runNo,
            status: parallelBox.status,
          };
        }
      }
    }

    return parallelBoxesExecutionState;
  },

  async getTasksExecutionState() {
    const tasksExecutionState = {};
    for (const lane of this.getAtmWorkflowExecutionLanes()) {
      for (const run of this.getLaneRuns(lane)) {
        for (const parallelBox of this.getRunParallelBoxes(run)) {
          const atmTaskExecutionRecords =
            await this.getParallelBoxTasks(parallelBox, { reload: true });
          for (const atmTaskExecutionRecord of atmTaskExecutionRecords) {
            const {
              entityId: taskInstanceId,
              schemaId: taskSchemaId,
              systemAuditLogId,
              status,
              itemsInProcessing,
              itemsProcessed,
              itemsFailed,
            } = getProperties(
              atmTaskExecutionRecord,
              'entityId',
              'schemaId',
              'systemAuditLogId',
              'status',
              'itemsInProcessing',
              'itemsProcessed',
              'itemsFailed'
            );

            if (!(taskSchemaId in tasksExecutionState)) {
              tasksExecutionState[taskSchemaId] = {
                runs: {},
              };
            }
            tasksExecutionState[taskSchemaId].runs[run.runNo] = {
              runNo: run.runNo,
              instanceId: taskInstanceId,
              systemAuditLogStoreInstanceId: systemAuditLogId,
              status,
              itemsInProcessing,
              itemsProcessed,
              itemsFailed,
            };
          }
        }
      }
    }
    return tasksExecutionState;
  },

  async getStoresExecutionState({
    workflowExecutionState,
    lanesExecutionState,
    tasksExecutionState,
  }) {
    const definedStores = this.getDefinedStoresExecutionState();
    const definedStoreInstanceIds =
      Object.values(definedStores).mapBy('instanceId').compact();
    const generatedStores = await this.getGeneratedStoresExecutionState({
      workflowExecutionState,
      lanesExecutionState,
      tasksExecutionState,
      definedStoreInstanceIds,
    });
    return {
      defined: definedStores,
      generated: generatedStores,
    };
  },

  getDefinedStoresExecutionState() {
    const storeRegistry = this.get('atmWorkflowExecution.storeRegistry') || {};
    const definedStoresExecutionState = {};
    for (const storeSchemaId in storeRegistry) {
      const storeInstanceId = storeRegistry[storeSchemaId];
      if (storeInstanceId) {
        definedStoresExecutionState[storeSchemaId] = {
          instanceId: storeInstanceId,
        };
      }
    }
    return definedStoresExecutionState;
  },

  async getGeneratedStoresExecutionState({
    workflowExecutionState,
    lanesExecutionState,
    tasksExecutionState,
    definedStoreInstanceIds,
  }) {
    const generatedStoreInstanceIds = new Set();
    if (workflowExecutionState.systemAuditLogStoreInstanceId) {
      generatedStoreInstanceIds.add(
        workflowExecutionState.systemAuditLogStoreInstanceId
      );
    }

    const storeInstanceIdsArrays = [];
    for (const laneExecutionState of Object.values(lanesExecutionState)) {
      const runs = Object.values(laneExecutionState.runs);
      storeInstanceIdsArrays.push(
        runs.mapBy('iteratedStoreInstanceId').compact()
      );
    }
    for (const taskExecutionState of Object.values(tasksExecutionState)) {
      const runs = Object.values(taskExecutionState.runs);
      storeInstanceIdsArrays.push(
        runs.mapBy('systemAuditLogStoreInstanceId').compact()
      );
    }
    for (const storeInstanceIdsArray of storeInstanceIdsArrays) {
      for (const storeInstanceId of storeInstanceIdsArray) {
        if (!storeInstanceId) {
          continue;
        }
        generatedStoreInstanceIds.add(storeInstanceId);
      }
    }

    for (const definedStoreInstanceId of definedStoreInstanceIds) {
      generatedStoreInstanceIds.delete(definedStoreInstanceId);
    }

    const generatedStores = {};
    for (const storeInstanceId of generatedStoreInstanceIds) {
      const store = await this.getAtmStoreRecord(storeInstanceId);
      const {
        type,
        dataSpec,
        initialValue,
      } = getProperties(store, 'type', 'dataSpec', 'initialValue');
      generatedStores[storeInstanceId] = {
        instanceId: storeInstanceId,
        type,
        dataSpec,
        defaultInitialValue: initialValue,
      };
    }

    return generatedStores;
  },

  getAtmWorkflowExecutionLanes() {
    return (this.get('atmWorkflowExecution.lanes') || []).filterBy('schemaId');
  },

  getLaneRuns(lane) {
    return (lane && lane.runs || [])
      .filter((run) => run && (typeof run.runNo === 'number'));
  },

  getRunParallelBoxes(run) {
    return (run && run.parallelBoxes || []).filterBy('schemaId');
  },

  async getParallelBoxTasks(parallelBox, { reload = false }) {
    const taskRegistry = parallelBox && parallelBox.taskRegistry || {};
    const tasks = [];
    for (const taskSchemaId in taskRegistry) {
      const taskInstanceId = taskRegistry[taskSchemaId];
      if (!taskInstanceId) {
        continue;
      }

      tasks.push(await this.getAtmTaskExecutionRecord(taskInstanceId, { reload }));
    }

    return tasks;
  },

  async getAtmTaskExecutionRecord(atmTaskInstanceId, { reload = false }) {
    const {
      atmTaskExecutionRecordsCache,
      workflowManager,
    } = this.getProperties(
      'atmTaskExecutionRecordsCache',
      'workflowManager'
    );

    const cachedAtmTaskExecutionRecord =
      atmTaskExecutionRecordsCache[atmTaskInstanceId];
    const isCachedAtmTaskExecutionEnded = cachedAtmTaskExecutionRecord &&
      taskEndedStatuses.includes(get(cachedAtmTaskExecutionRecord, 'status'));
    if (
      atmTaskExecutionRecordsCache[atmTaskInstanceId] &&
      (isCachedAtmTaskExecutionEnded || !reload)
    ) {
      return atmTaskExecutionRecordsCache[atmTaskInstanceId];
    }

    const atmTaskExecutionRecord = await workflowManager
      .getAtmTaskExecutionById(atmTaskInstanceId, { reload });
    atmTaskExecutionRecordsCache[atmTaskInstanceId] = atmTaskExecutionRecord;
    return atmTaskExecutionRecord;
  },

  async getAtmStoreRecord(atmStoreInstanceId) {
    const {
      atmStoreRecordsCache,
      workflowManager,
    } = this.getProperties(
      'atmStoreRecordsCache',
      'workflowManager'
    );

    const cachedAtmStoreRecord = atmStoreRecordsCache[atmStoreInstanceId];
    if (cachedAtmStoreRecord) {
      return cachedAtmStoreRecord;
    }

    const atmStoreRecord =
      await workflowManager.getAtmStoreById(atmStoreInstanceId);
    atmStoreRecordsCache[atmStoreInstanceId] = atmStoreRecord;
    return atmStoreRecord;
  },
});
