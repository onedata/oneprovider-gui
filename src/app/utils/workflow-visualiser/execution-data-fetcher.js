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
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { hash as hashFulfilled } from 'rsvp';

const notFoundError = { id: 'notFound' };

export default ExecutionDataFetcher.extend(OwnerInjector, I18n, {
  workflowManager: service(),
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.workflowVisualiser.executionDataFetcher',

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
          runType: run.runType,
          iteratedStoreInstanceId: run.iteratedStoreId,
          exceptionStoreInstanceId: run.exceptionStoreId,
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
    const failedItemsStoresSourceRun = {};

    if (workflowExecutionState.systemAuditLogStoreInstanceId) {
      generatedStoreInstanceIds.add(
        workflowExecutionState.systemAuditLogStoreInstanceId
      );
    }

    for (const laneExecutionState of Object.values(lanesExecutionState)) {
      for (const run of Object.values(laneExecutionState.runs)) {
        if (run.iteratedStoreInstanceId) {
          generatedStoreInstanceIds.add(run.iteratedStoreInstanceId);
        }
        if (run.exceptionStoreInstanceId) {
          generatedStoreInstanceIds.add(run.exceptionStoreInstanceId);
          failedItemsStoresSourceRun[run.exceptionStoreInstanceId] = run.runNo;
        }
      }
    }
    for (const taskExecutionState of Object.values(tasksExecutionState)) {
      for (const run of Object.values(taskExecutionState.runs)) {
        if (run.systemAuditLogStoreInstanceId) {
          generatedStoreInstanceIds.add(run.systemAuditLogStoreInstanceId);
        }
      }
    }

    for (const definedStoreInstanceId of definedStoreInstanceIds) {
      generatedStoreInstanceIds.delete(definedStoreInstanceId);
    }

    const storeRecords = await hashFulfilled(
      [...generatedStoreInstanceIds].reduce((hash, storeInstanceId) => {
        hash[storeInstanceId] = this.getAtmStoreRecord(storeInstanceId);
        return hash;
      }, {})
    );
    const generatedStores = {};
    for (const storeInstanceId of generatedStoreInstanceIds) {
      const store = storeRecords[storeInstanceId];
      const {
        type,
        dataSpec,
        initialValue,
      } = getProperties(store, 'type', 'dataSpec', 'initialValue');
      let name = null;
      if (storeInstanceId in failedItemsStoresSourceRun) {
        name = this.t('failedItemsStore', {
          sourceRunNo: failedItemsStoresSourceRun[storeInstanceId],
        });
      }
      generatedStores[storeInstanceId] = {
        instanceId: storeInstanceId,
        name,
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
