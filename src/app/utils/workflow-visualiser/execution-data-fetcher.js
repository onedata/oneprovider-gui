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
import _ from 'lodash';
import { inAdvanceRunNo } from 'onedata-gui-common/utils/workflow-visualiser/run-utils';

const notFoundError = { id: 'notFound' };
const unavailableTaskInstanceIdPrefix = '__unavailableTaskInstanceId';

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
    const atmWorkflowSchemaExecution = await this.getReloadedAtmWorkflowExecution();
    const atmWorkflowSchemaSnapshot = await this.getAtmWorkflowSchemaSnapshot();
    const rawWorkflowExecutionState = this.getNormalizedRawWorkflowExecutionState(
      atmWorkflowSchemaExecution,
      atmWorkflowSchemaSnapshot,
    );

    const workflowExecutionState = this.getWorkflowExecutionState({
      rawWorkflowExecutionState,
    });
    const lanesExecutionState = this.getLanesExecutionState({
      rawWorkflowExecutionState,
    });
    const parallelBoxesExecutionState = this.getParallelBoxesExecutionState({
      rawWorkflowExecutionState,
    });
    const tasksExecutionState = await this.getTasksExecutionState({
      rawWorkflowExecutionState,
    });
    const definedStoresExecutionState = this.getDefinedStoresExecutionState({
      rawWorkflowExecutionState,
    });
    const generatedStoresExecutionState = await this.getGeneratedStoresExecutionState({
      workflowExecutionState,
      lanesExecutionState,
      tasksExecutionState,
      definedStoresExecutionState,
    });

    return {
      workflow: workflowExecutionState,
      lane: lanesExecutionState,
      parallelBox: parallelBoxesExecutionState,
      task: tasksExecutionState,
      store: {
        defined: definedStoresExecutionState,
        generated: generatedStoresExecutionState,
      },
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

  /**
   * @returns {Models.AtmWorkflowExecution}
   */
  async getReloadedAtmWorkflowExecution() {
    return await this.get('atmWorkflowExecution').reload();
  },

  /**
   * @returns {Models.AtmWorkflowSchemaSnapshot}
   */
  async getAtmWorkflowSchemaSnapshot() {
    return await get(this.get('atmWorkflowExecution'), 'atmWorkflowSchemaSnapshot');
  },

  /**
   * @returns {AtmWorkflowExecutionState}
   */
  getWorkflowExecutionState({ rawWorkflowExecutionState }) {
    return {
      instanceId: rawWorkflowExecutionState.entityId,
      systemAuditLogStoreInstanceId: rawWorkflowExecutionState.systemAuditLogId,
      status: rawWorkflowExecutionState.status,
    };
  },

  /**
   * @returns {AtmLanesExecutionState}
   */
  getLanesExecutionState({ rawWorkflowExecutionState }) {
    const lanesExecutionState = {};
    for (const lane of rawWorkflowExecutionState.lanes) {
      const laneSchemaId = lane.schemaId;
      const runsRegistry = {};
      for (const run of lane.runs) {
        const runNo = this.normalizeRunNo(run.runNo);
        runsRegistry[runNo] = {
          runNo,
          sourceRunNo: run.sourceRunNo,
          runType: run.runType,
          iteratedStoreInstanceId: run.iteratedStoreId,
          exceptionStoreInstanceId: run.exceptionStoreId,
          status: run.status,
        };
      }

      lanesExecutionState[laneSchemaId] = {
        runsRegistry,
      };
    }

    return lanesExecutionState;
  },

  /**
   * @returns {AtmParallelBoxesExecutionState}
   */
  getParallelBoxesExecutionState({ rawWorkflowExecutionState }) {
    const parallelBoxesExecutionState = {};
    for (const lane of rawWorkflowExecutionState.lanes) {
      for (const run of lane.runs) {
        const runNo = this.normalizeRunNo(run.runNo);
        for (const parallelBox of run.parallelBoxes) {
          const parallelBoxSchemaId = parallelBox.schemaId;
          if (!(parallelBoxSchemaId in parallelBoxesExecutionState)) {
            parallelBoxesExecutionState[parallelBoxSchemaId] = {
              runsRegistry: {},
            };
          }

          parallelBoxesExecutionState[parallelBoxSchemaId].runsRegistry[runNo] = {
            runNo,
            status: parallelBox.status,
          };
        }
      }
    }

    return parallelBoxesExecutionState;
  },

  /**
   * @returns {Promise<AtmTasksExecutionState>}
   */
  async getTasksExecutionState({ rawWorkflowExecutionState }) {
    const tasksExecutionState = {};
    for (const lane of rawWorkflowExecutionState.lanes) {
      for (const run of lane.runs) {
        const runNo = this.normalizeRunNo(run.runNo);
        for (const parallelBox of run.parallelBoxes) {
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
                runsRegistry: {},
              };
            }
            tasksExecutionState[taskSchemaId].runsRegistry[runNo] = {
              runNo,
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

  /**
   * @returns {AtmDefinedStoresExecutionState}
   */
  getDefinedStoresExecutionState({ rawWorkflowExecutionState }) {
    const storeRegistry = rawWorkflowExecutionState.storeRegistry;
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

  /**
   * @returns {Promise<AtmGeneratedStoresExecutionState>}
   */
  async getGeneratedStoresExecutionState({
    workflowExecutionState,
    lanesExecutionState,
    tasksExecutionState,
    definedStoresExecutionState,
  }) {
    const generatedStoreInstanceIds = new Set();
    const failedItemsStoresSourceRun = {};

    // workflow audit log store
    if (workflowExecutionState.systemAuditLogStoreInstanceId) {
      generatedStoreInstanceIds.add(
        workflowExecutionState.systemAuditLogStoreInstanceId
      );
    }

    for (const laneExecutionState of Object.values(lanesExecutionState)) {
      for (const run of Object.values(laneExecutionState.runsRegistry)) {
        // lane iterated store
        if (run.iteratedStoreInstanceId) {
          generatedStoreInstanceIds.add(run.iteratedStoreInstanceId);
        }
        // lane exception store
        if (run.exceptionStoreInstanceId) {
          generatedStoreInstanceIds.add(run.exceptionStoreInstanceId);
          failedItemsStoresSourceRun[run.exceptionStoreInstanceId] = run.runNo;
        }
      }
    }
    for (const taskExecutionState of Object.values(tasksExecutionState)) {
      for (const run of Object.values(taskExecutionState.runsRegistry)) {
        // task audit log store
        if (run.systemAuditLogStoreInstanceId) {
          generatedStoreInstanceIds.add(run.systemAuditLogStoreInstanceId);
        }
      }
    }

    // deleting stores, which are defined in schema (so are not generated)
    for (const definedStore of Object.values(definedStoresExecutionState)) {
      generatedStoreInstanceIds.delete(definedStore.instanceId);
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
      // For exceptions stores we need to generate names. Some of them will
      // be visible as an iterated store (so must be distinguishable by name).
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

  async getParallelBoxTasks(parallelBox, { reload = false }) {
    const taskRegistry = parallelBox.taskRegistry || {};
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

    if (this.isUnavailableAtmTaskInstanceId(atmTaskInstanceId)) {
      const {
        schemaId,
        status,
      } = this.extractUnavailableAtmTaskInstanceIdData(atmTaskInstanceId);
      return {
        schemaId,
        systemAuditLogId: null,
        status,
        itemsInProcessing: 0,
        itemsProcessed: 0,
        itemsFailed: 0,
      };
    }

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

  getNormalizedRawWorkflowExecutionState(
    atmWorkflowExecution,
    atmWorkflowSchemaSnapshot
  ) {
    const {
      entityId,
      lanes,
      status,
      systemAuditLogId,
      storeRegistry,
    } = getProperties(
      atmWorkflowExecution,
      'entityId',
      'lanes',
      'status',
      'systemAuditLogId',
      'storeRegistry'
    );
    const lanesSchemas = get(atmWorkflowSchemaSnapshot, 'lanes') || [];

    const normalizedLanes = _.cloneDeep((lanes || []).filterBy('schemaId'));
    let prevLaneFirstRunStatus;
    for (let i = 0; i < normalizedLanes.length; i++) {
      const lane = normalizedLanes[i];
      if (!lane.runs) {
        lane.runs = [];
      }
      lane.runs = lane.runs.filter((run) =>
        run && (typeof run.runNo === 'number' || run.runNo === null)
      );

      for (const run of lane.runs) {
        run.parallelBoxes = (run.parallelBoxes || []).filterBy('schemaId');
      }

      // For the first run we have to show something for each lane
      // (even if backend does not provide enough data). To do this, we have to
      // "guess" first run execution data depending on the first run in previous lane.
      // NOTICE: There should be always a first run in the first lane in data
      // provided by backend. So the logic of inferring data from previous lane
      // should hold. But in case of an abnormal response, we also check the
      // first lane and generate "pending" first run if first run is not defined.
      if (!lane.runs[0]) {
        const guessedStatus = prevLaneFirstRunStatus === 'cancelled' ||
          prevLaneFirstRunStatus === 'skipped' ? 'skipped' : 'pending';
        const laneSchema = lanesSchemas.findBy('id', lane.schemaId) || {};
        const parallelBoxesSchemas = (laneSchema.parallelBoxes || []).filterBy('id');
        const guessedParallelBoxes = [];
        for (const parallelBoxSchema of parallelBoxesSchemas) {
          const guessedTaskRegistry = {};
          (parallelBoxSchema.tasks || [])
          .mapBy('id')
            .compact()
            .forEach((taskSchemaId) =>
              guessedTaskRegistry[taskSchemaId] =
              this.generateUnavailableAtmTaskInstanceId(taskSchemaId, guessedStatus)
            );
          const parallelBoxData = {
            schemaId: parallelBoxSchema.id,
            status: guessedStatus,
            taskRegistry: guessedTaskRegistry,
          };
          guessedParallelBoxes.push(parallelBoxData);
        }
        lane.runs[0] = {
          runNo: 1,
          sourceRunNo: null,
          runType: 'regular',
          iteratedStoreInstanceId: null,
          exceptionStoreInstanceId: null,
          status: guessedStatus,
          parallelBoxes: guessedParallelBoxes,
        };
      }
      prevLaneFirstRunStatus = lane.runs[0].status;
    }

    return {
      entityId,
      lanes: normalizedLanes,
      status,
      systemAuditLogId,
      storeRegistry,
    };
  },

  generateUnavailableAtmTaskInstanceId(atmTaskSchemaId, status) {
    return `${unavailableTaskInstanceIdPrefix}|${atmTaskSchemaId}|${status}`;
  },

  isUnavailableAtmTaskInstanceId(atmTaskInstanceId) {
    return atmTaskInstanceId.startsWith(unavailableTaskInstanceIdPrefix);
  },

  extractUnavailableAtmTaskInstanceIdData(unavailableAtmTaskInstanceId) {
    const [, schemaId, status] = unavailableAtmTaskInstanceId.split('|');
    return { schemaId, status };
  },

  normalizeRunNo(rawRunNo) {
    if (rawRunNo === null) {
      return inAdvanceRunNo;
    } else {
      return Number.parseInt(rawRunNo);
    }
  },
});
