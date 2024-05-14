/**
 * Real implementation of workflow execution data fetcher.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

/**
 * @typedef {Object} AtmStoreContentPresentersCache
 * @property {Object<string, AtmFile|null>} symbolicLinkTargetById
 * @property {Object<string, string|null>} filePathById
 * @property {Object<string, string|null>} fileUrlById
 * @property {Object<string, AtmFile|null>} fileDetailsById
 * @property {Object<string, string|null>} datasetUrlById
 * @property {Object<string, AtmDataset|null>} datasetDetailsById
 * @property {Object<string, string|null>} groupUrlById
 * @property {Object<string, AtmGroup|null>} groupDetailsById
 */

import ExecutionDataFetcher from 'onedata-gui-common/utils/workflow-visualiser/execution-data-fetcher';
import { get, getProperties } from '@ember/object';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { inject as service } from '@ember/service';
import {
  laneSuspendedStatuses,
  laneEndedStatuses,
  taskEndedStatuses,
} from 'onedata-gui-common/utils/workflow-visualiser/statuses';
import I18n from 'onedata-gui-common/mixins/i18n';
import { hash as hashFulfilled } from 'rsvp';
import _ from 'lodash';
import { inAdvanceRunNumber } from 'onedata-gui-common/utils/workflow-visualiser/run-utils';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import cdmiObjectIdToGuid from 'onedata-gui-common/utils/cdmi-object-id-to-guid';
import { convertFromLegacyFileTypeIfNeeded, isFileType } from 'onedata-gui-common/utils/file';
import guidToCdmiObjectId from 'onedata-gui-common/utils/guid-to-cdmi-object-id';

const notFoundError = { id: 'notFound' };
const unavailableTaskInstanceIdPrefix = '__unavailableTaskInstanceId';
const laneStatusesCausingUnscheduled = [
  ...laneSuspendedStatuses,
  ...laneEndedStatuses,
  'unscheduled',
];

export default ExecutionDataFetcher.extend(OwnerInjector, I18n, {
  workflowManager: service(),
  i18n: service(),
  parentAppNavigation: service(),
  fileManager: service(),
  datasetManager: service(),
  groupManager: service(),
  filesViewResolver: service(),
  appProxy: service(),

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
   * @virtual
   * @type {string}
   */
  spaceId: undefined,

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

  /**
   * @type {AtmStoreContentPresentersCache}
   */
  atmStoreContentPresentersCache: undefined,

  init() {
    this._super(...arguments);

    this.setProperties({
      atmTaskExecutionRecordsCache: {},
      atmStoreRecordsCache: {},
      atmStoreContentPresentersCache: {
        symbolicLinkTargetById: {},
        filePathById: {},
        fileUrlById: {},
        fileDetailsById: {},
        datasetUrlById: {},
        datasetDetailsById: {},
        groupUrlById: {},
        groupDetailsById: {},
      },
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
  async fetchStoreContent(storeInstanceId, browseOptions) {
    if (!storeInstanceId) {
      console.error(
        'util:workflow-visualiser/execution-data-fetcher#fetchStoreContent: invalid storeSchemaId',
      );
      throw notFoundError;
    }

    return await this.get('workflowManager')
      .getAtmStoreContent(storeInstanceId, browseOptions);
  },

  /**
   * @override
   */
  async convertAtmExceptionStoreTraceIdsToIndices(storeInstanceId, traceIds) {
    if (!storeInstanceId) {
      console.error(
        'execution-data-fetcher#convertAtmExceptionStoreTraceIdsToIndices: invalid storeInstanceId',
      );
      throw notFoundError;
    }

    return await this.workflowManager
      .convertAtmExceptionStoreTraceIdsToIndices(storeInstanceId, traceIds);
  },

  /**
   * @override
   */
  getStoreContentPresenterContext() {
    return {
      getSymbolicLinkTargetById: this.getSymbolicLinkTargetById.bind(this),
      getFilePathById: this.getFilePathById.bind(this),
      getFileUrlById: this.getFileUrlById.bind(this),
      getFileDetailsById: this.getFileDetailsById.bind(this),
      getDatasetUrlById: this.getDatasetUrlById.bind(this),
      getDatasetDetailsById: this.getDatasetDetailsById.bind(this),
      getGroupUrlById: this.getGroupUrlById.bind(this),
      getGroupDetailsById: this.getGroupDetailsById.bind(this),
      // Using `_blank` to open file/dataset/group URLs in a new tab
      linkTarget: '_blank',
    };
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
        const runNumber = this.normalizeRunNumber(run.runNumber);
        runsRegistry[runNumber] = {
          runNumber,
          originRunNumber: run.originRunNumber,
          runType: run.runType,
          iteratedStoreInstanceId: run.iteratedStoreId,
          exceptionStoreInstanceId: run.exceptionStoreId,
          status: run.status,
          isRetriable: run.isRetriable,
          isRerunable: run.isRerunable,
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
        const runNumber = this.normalizeRunNumber(run.runNumber);
        for (const parallelBox of run.parallelBoxes) {
          const parallelBoxSchemaId = parallelBox.schemaId;
          if (!(parallelBoxSchemaId in parallelBoxesExecutionState)) {
            parallelBoxesExecutionState[parallelBoxSchemaId] = {
              runsRegistry: {},
            };
          }

          parallelBoxesExecutionState[parallelBoxSchemaId].runsRegistry[runNumber] = {
            runNumber,
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
        const runNumber = this.normalizeRunNumber(run.runNumber);
        for (const parallelBox of run.parallelBoxes) {
          const atmTaskExecutionRecords =
            await this.getParallelBoxTasks(parallelBox, { reload: true });
          for (const atmTaskExecutionRecord of atmTaskExecutionRecords) {
            const {
              entityId: taskInstanceId,
              schemaId: taskSchemaId,
              systemAuditLogId,
              timeSeriesStoreId,
              status,
              itemsInProcessing,
              itemsProcessed,
              itemsFailed,
            } = getProperties(
              atmTaskExecutionRecord,
              'entityId',
              'schemaId',
              'systemAuditLogId',
              'timeSeriesStoreId',
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
            tasksExecutionState[taskSchemaId].runsRegistry[runNumber] = {
              runNumber,
              instanceId: taskInstanceId,
              systemAuditLogStoreInstanceId: systemAuditLogId,
              timeSeriesStoreInstanceId: timeSeriesStoreId,
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
    const failedItemsStoresOriginRun = {};

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
          failedItemsStoresOriginRun[run.exceptionStoreInstanceId] = run.runNumber;
        }
      }
    }
    for (const taskExecutionState of Object.values(tasksExecutionState)) {
      for (const run of Object.values(taskExecutionState.runsRegistry)) {
        // task audit log store
        if (run.systemAuditLogStoreInstanceId) {
          generatedStoreInstanceIds.add(run.systemAuditLogStoreInstanceId);
        }
        // task time series store
        if (run.timeSeriesStoreInstanceId) {
          generatedStoreInstanceIds.add(run.timeSeriesStoreInstanceId);
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
        config,
        initialContent,
      } = getProperties(store, 'type', 'config', 'initialContent');
      let name = null;
      // For exceptions stores we need to generate names. Some of them will
      // be visible as an iterated store (so must be distinguishable by name).
      if (storeInstanceId in failedItemsStoresOriginRun) {
        name = this.t('failedItemsStore', {
          originRunNumber: failedItemsStoresOriginRun[storeInstanceId],
        });
      }
      generatedStores[storeInstanceId] = {
        instanceId: storeInstanceId,
        name,
        type,
        config,
        defaultInitialContent: initialContent,
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
        timeSeriesStoreId: null,
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
    const revisionRegistry = get(atmWorkflowSchemaSnapshot, 'revisionRegistry');
    const revision = Object.values(revisionRegistry || {})[0];
    const lanesSchemas = (get(revision || {}, 'lanes') || []).filterBy('id');

    const normalizedLanes = [];
    // mapping (runNumber -> status) for previous processed lane (used by loop below)
    let prevLaneStatusesPerRun = {};
    // mapping (runNumber -> status) for lane under processing (used by loop below)
    let laneStatusesPerRun = {};
    // status for the latest run of previous processed lane (this is a shortcut, can be
    // also calculated from `prevLaneStatusesPerRun`).
    let prevLaneLatestRunStatus;
    // for each lane schema
    for (let i = 0; i < lanesSchemas.length; i++) {
      const laneSchema = lanesSchemas[i];
      // find lane associated to lane schema (or create an empty one if not exist)
      const lane = _.cloneDeep((lanes || []).findBy('schemaId', laneSchema.id)) || {
        schemaId: laneSchema.id,
      };

      // Reject lane runs with unknown runNumber. We also ignore `null` to omit
      // active "prepare-in-advance" run as it is rather an internal information
      // and may confuse users.
      lane.runs = (lane.runs || [])
        .filter((run) => typeof run?.runNumber === 'number');
      // Each lane must have at least one run. If backend hasn't sent us any,
      // we add a fake "prepare-in-advance" run.
      if (!lane.runs[0]) {
        lane.runs[0] = {
          runNumber: null,
          originRunNumber: null,
          runType: 'regular',
        };
      }

      const parallelBoxesSchemas = (laneSchema.parallelBoxes || []).filterBy('id');
      // for each run of this lane
      for (let j = 0; j < lane.runs.length; j++) {
        const run = lane.runs[j];
        const isPreparedInAdvanceRun = run.runNumber === null;
        // status of the previous lane in the same run
        const prevLaneRunStatus = (isPreparedInAdvanceRun ?
          prevLaneLatestRunStatus : prevLaneStatusesPerRun[run.runNumber]) || 'pending';
        // status, that should be used as a fallback value when status of this run
        // is not defined
        const fallbackLaneRunStatus =
          laneStatusesCausingUnscheduled.includes(prevLaneRunStatus) ?
          'unscheduled' : 'pending';
        run.status = run.status || fallbackLaneRunStatus;
        // status, that should be used as a fallback value when status of inner-lane
        // elements (parallel boxes and tasks) is not defined
        const laneElementsFallbackRunStatus =
          laneStatusesCausingUnscheduled.includes(run.status) ?
          'unscheduled' : 'pending';
        const parallelBoxes = run.parallelBoxes || [];
        // normalize each parallel box (and so tasks inside it) in this run
        run.parallelBoxes = parallelBoxesSchemas.map((parallelBoxSchema) =>
          this.getNormalizedRawParallelBoxExecutionState({
            parallelBoxSchema,
            rawParallelBoxes: parallelBoxes,
            laneElementsFallbackRunStatus,
          })
        );
        laneStatusesPerRun[run.runNumber] = run.status;
        if (j === lane.runs.length - 1) {
          prevLaneLatestRunStatus = run.status;
        }
      }
      prevLaneStatusesPerRun = laneStatusesPerRun;
      laneStatusesPerRun = {};
      normalizedLanes.push(lane);
    }

    return {
      entityId,
      lanes: normalizedLanes,
      status,
      systemAuditLogId,
      storeRegistry,
    };
  },

  getNormalizedRawParallelBoxExecutionState({
    parallelBoxSchema,
    rawParallelBoxes,
    laneElementsFallbackRunStatus,
  }) {
    // find pbox associated to pbox schema (or create an empty one if not exist)
    const parallelBox = rawParallelBoxes.findBy('schemaId', parallelBoxSchema.id) || {
      schemaId: parallelBoxSchema.id,
    };
    if (!parallelBox.status) {
      parallelBox.status = laneElementsFallbackRunStatus;
    }

    const taskRegistry = parallelBox.taskRegistry || {};
    const taskSchemas = (parallelBoxSchema.tasks || []).filterBy('id');
    const normalizedTaskRegistry = {};
    for (const taskSchema of taskSchemas) {
      // use taskInstanceId received via taskRegistry or generate a fake one
      // which will contain info about schema id and status (will be used to mock
      // task records, which does not exist in the backend)
      const taskInstanceId = taskRegistry[taskSchema.id] ||
        this.generateUnavailableAtmTaskInstanceId(
          taskSchema.id,
          laneElementsFallbackRunStatus
        );
      normalizedTaskRegistry[taskSchema.id] = taskInstanceId;
    }
    parallelBox.taskRegistry = normalizedTaskRegistry;
    return parallelBox;
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

  normalizeRunNumber(rawRunNumber) {
    if (rawRunNumber === null) {
      return inAdvanceRunNumber;
    } else {
      return Number.parseInt(rawRunNumber);
    }
  },

  /**
   * @param {string} cdmiObjectId
   * @returns {Promise<AtmFile|null>}
   */
  async getSymbolicLinkTargetById(cdmiObjectId) {
    const fileId = cdmiObjectId && cdmiObjectIdToGuid(cdmiObjectId);
    if (!fileId) {
      return null;
    }
    const cache = this.atmStoreContentPresentersCache;
    if (fileId in cache.symbolicLinkTargetById) {
      return cache.symbolicLinkTargetById[fileId];
    }
    const file = await this.fileManager.getFileById(fileId);
    const target = get(file, 'symlinkTargetFile');
    const {
      cdmiObjectId: targetCdmiObjectId,
      type: targetType,
      name: targetName,
      size: targetSize,
    } = getProperties(target, 'cdmiObjectId', 'type', 'name', 'size');
    const result = {
      fileId: targetCdmiObjectId,
      type: convertFromLegacyFileTypeIfNeeded(targetType),
      name: targetName,
      size: targetSize,
    };
    cache.symbolicLinkTargetById[fileId] = result;
    return result;
  },

  /**
   * @param {string} cdmiObjectId
   * @returns {Promise<string|null>}
   */
  async getFilePathById(cdmiObjectId) {
    const fileId = cdmiObjectId && cdmiObjectIdToGuid(cdmiObjectId);
    if (!fileId) {
      return null;
    }
    const cache = this.atmStoreContentPresentersCache;
    if (fileId in cache.filePathById) {
      return cache.filePathById[fileId];
    }
    const file = await this.fileManager.getFileById(fileId);
    const filePathRecords = await resolveFilePath(file);
    const result = stringifyFilePath(filePathRecords);
    cache.filePathById[fileId] = result;
    return result;
  },

  /**
   * @param {string} cdmiObjectId
   * @returns {Promise<string|null>}
   */
  async getFileUrlById(cdmiObjectId) {
    const fileId = cdmiObjectId && cdmiObjectIdToGuid(cdmiObjectId);
    if (!fileId) {
      return null;
    }
    const cache = this.atmStoreContentPresentersCache;
    if (fileId in cache.fileUrlById) {
      return cache.fileUrlById[fileId];
    }
    const result = await this.filesViewResolver.generateUrlById(fileId);
    cache.fileUrlById[fileId] = result;
    return result;
  },

  /**
   * @param {string} cdmiObjectId
   * @returns {Promise<AtmFile|null>}
   */
  async getFileDetailsById(cdmiObjectId) {
    const fileId = cdmiObjectId && cdmiObjectIdToGuid(cdmiObjectId);
    if (!fileId) {
      return null;
    }
    const cache = this.atmStoreContentPresentersCache;
    if (fileId in cache.fileDetailsById) {
      return cache.fileDetailsById[fileId];
    }

    const file = await this.fileManager.getFileById(fileId);
    const result = {
      fileId: cdmiObjectId,
      name: get(file, 'name'),
      size: get(file, 'size') ?? null,
    };
    const fileType = convertFromLegacyFileTypeIfNeeded(get(file, 'type'));
    if (isFileType(fileType)) {
      result.type = fileType;
    }

    cache.fileDetailsById[fileId] = result;
    return result;
  },

  /**
   * @param {string} datasetId
   * @returns {Promise<string|null>}
   */
  async getDatasetUrlById(datasetId) {
    if (!datasetId) {
      return null;
    }
    const cache = this.atmStoreContentPresentersCache;
    if (datasetId in cache.datasetUrlById) {
      return cache.datasetUrlById[datasetId];
    }
    const result = this.appProxy.callParent('getDatasetsUrl', {
      selectedDatasets: [datasetId],
    }) || null;
    cache.datasetUrlById[datasetId] = result;
    return result;
  },

  /**
   * @param {string} datasetId
   * @returns {Promise<AtmDataset|null>}
   */
  async getDatasetDetailsById(datasetId) {
    if (!datasetId) {
      return null;
    }
    const cache = this.atmStoreContentPresentersCache;
    if (datasetId in cache.datasetDetailsById) {
      return cache.datasetDetailsById[datasetId];
    }

    const dataset = await this.datasetManager.getDataset(datasetId);
    const rootFileId = dataset.relationEntityId('rootFile');
    const result = {
      datasetId,
      rootFileId: rootFileId ? guidToCdmiObjectId(rootFileId) : null,
      rootFilePath: get(dataset, 'rootFilePath'),
      rootFileType: convertFromLegacyFileTypeIfNeeded(get(dataset, 'rootFileType')),
    };

    cache.datasetDetailsById[datasetId] = result;
    return result;
  },

  /**
   * @param {string} groupId
   * @returns {Promise<string|null>}
   */
  async getGroupUrlById(groupId) {
    if (!groupId) {
      return null;
    }
    const cache = this.atmStoreContentPresentersCache;
    if (groupId in cache.groupUrlById) {
      return cache.groupUrlById[groupId];
    }
    const result = this.appProxy.callParent('getGroupUrl', {
      groupId,
    }) || null;
    cache.groupUrlById[groupId] = result;
    return result;
  },

  /**
   * @param {string} groupId
   * @returns {Promise<AtmGroup|null>}
   */
  async getGroupDetailsById(groupId) {
    if (!groupId) {
      return null;
    }
    const cache = this.atmStoreContentPresentersCache;
    if (groupId in cache.groupDetailsById) {
      return cache.groupDetailsById[groupId];
    }

    const group = await this.groupManager.getGroupById(groupId, {
      throughSpaceId: this.spaceId,
    });
    const result = {
      groupId,
      name: get(group, 'name'),
      type: get(group, 'type'),
    };

    cache.groupDetailsById[groupId] = result;
    return result;
  },

  /**
   * @param {string} storeInstanceId
   * @returns {Promise<string>} download url
   */
  getAuditLogDownloadUrl(storeInstanceId) {
    return this.workflowManager.getAuditLogDownloadUrl(storeInstanceId);
  },
});
