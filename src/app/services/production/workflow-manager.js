/**
 * Provides backend functions related to workflows and inventories.
 *
 * @module services/workflow-manager
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { getProperties, get, computed } from '@ember/object';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { entityType as atmWorkflowSchemaEntityType } from 'oneprovider-gui/models/atm-workflow-schema';
import { entityType as atmWorkflowExecutionEntityType } from 'oneprovider-gui/models/atm-workflow-execution';
import {
  entityType as atmTaskExecutionEntityType,
  aspects as atmTaskExecutionAspects,
} from 'oneprovider-gui/models/atm-task-execution';
import { entityType as atmLambdaSnapshotEntityType } from 'oneprovider-gui/models/atm-lambda-snapshot';
import { entityType as atmStoreEntityType } from 'oneprovider-gui/models/atm-store';
import { allSettled } from 'rsvp';
import { reads } from '@ember/object/computed';
import { bool, promise } from 'ember-awesome-macros';
import { promiseArray } from 'onedata-gui-common/utils/ember/promise-array';
import AllKnownAtmWorkflowSchemasProxyArray from 'oneprovider-gui/utils/workflow-manager/all-known-atm-workflow-schemas-proxy-array';
import config from 'ember-get-config';

/**
 * @typedef {Object} OpenfaasFunctionEvent
 * For more information about fields used in this object see Kubernetes documentation.
 * @property {'Normal'|'Warning'} type
 * @property {string} reason
 * @property {string} message
 */

const emptyAtmStoreContent = { array: [], isLast: true };

export default Service.extend({
  store: service(),
  onedataGraph: service(),
  onedataConnection: service(),
  currentUser: service(),
  infiniteLogManager: service(),

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
  isBagitUploaderAvailable: computed(
    'isOpenfaasAvailable',
    'bagitUploaderWorkflowSchemaProxy.revisionRegistry',
    function isBagitUploaderAvailable() {
      const isOpenfaasAvailable = this.get('isOpenfaasAvailable');
      const bagitRevisionRegistry =
        this.get('bagitUploaderWorkflowSchemaProxy.revisionRegistry');
      return isOpenfaasAvailable &&
        bagitRevisionRegistry &&
        Object.keys(bagitRevisionRegistry).length > 0;
    }
  ),

  /**
   * @type {ComputedProperty<Models.AtmWorkflowSchema|null>}
   */
  bagitUploaderWorkflowSchemaProxy: promise.object(computed(
    'bagitUploaderWorkflowSchemaId',
    async function bagitUploaderWorkflowSchemaProxy() {
      const bagitUploaderWorkflowSchemaId =
        this.get('bagitUploaderWorkflowSchemaId');
      if (!bagitUploaderWorkflowSchemaId) {
        return null;
      }
      try {
        return await this.getAtmWorkflowSchemaById(bagitUploaderWorkflowSchemaId);
      } catch (error) {
        // When bagit uploader workflow cannot be fetched, then it is not a
        // big deal. GUI can still work without it.
        if (config.environment !== 'test') {
          console.error(
            'component:content-file-browser#bagitUploaderLoaderProxy: cannot fetch bagit uploader workflow schema',
            error
          );
        }
        return null;
      }
    }
  )),

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
   * @param {Boolean} [fetchOptions.backgroundReload=false]
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
   * @param {String} atmLambdaSnapshotId
   * @returns {Promise<Models.AtmLambdaSnapshot>}
   */
  async getAtmLambdaSnapshotById(atmLambdaSnapshotId) {
    const atmLambdaSnapshotGri = gri({
      entityType: atmLambdaSnapshotEntityType,
      entityId: atmLambdaSnapshotId,
      aspect: 'instance',
      scope: 'private',
    });
    return await this.get('store')
      .findRecord('atmLambdaSnapshot', atmLambdaSnapshotGri);
  },

  /**
   * @param {String} storeId
   * @param {Boolean} [fetchOptions.reload=false]
   * @param {Boolean} [fetchOptions.backgroundReload=false]
   * @returns {Promise<Models.AtmStore>}
   */
  async getAtmStoreById(storeId, {
    reload = false,
    backgroundReload = false,
  } = {}) {
    const storeGri = gri({
      entityType: atmStoreEntityType,
      entityId: storeId,
      aspect: 'instance',
      scope: 'private',
    });
    return await this.get('store')
      .findRecord('atmStore', storeGri, { reload, backgroundReload });
  },

  /**
   * @param {String} atmWorkflowSchemaId
   * @param {RevisionNumber} atmWorkflowSchemaRevisionNumber
   * @param {String} spaceId
   * @param {Object} storeInitialContents map (storeSchemaId => initial content)
   * @returns {Promise<Models.AtmWorkflowExecution>}
   */
  async runWorkflow(
    atmWorkflowSchemaId,
    atmWorkflowSchemaRevisionNumber,
    spaceId,
    storeInitialContents
  ) {
    return await this.get('store').createRecord('atmWorkflowExecution', {
      _meta: {
        additionalData: {
          atmWorkflowSchemaId,
          atmWorkflowSchemaRevisionNumber,
          spaceId,
          storeInitialContents,
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
   * @param {string} atmTaskExecutionId
   * @param {Boolean} [fetchOptions.reload=false]
   * @param {Boolean} [fetchOptions.backgroundReload=false]
   * @returns {Promise<Models.OpenfaasFunctionActivityRegistry>}
   */
  async getAtmTaskExecutionOpenfaasActivityRegistry(atmTaskExecutionId, {
    reload = false,
    backgroundReload = false,
  } = {}) {
    const activityRegistryGri = gri({
      entityType: atmTaskExecutionEntityType,
      entityId: atmTaskExecutionId,
      aspect: atmTaskExecutionAspects.openfaasFunctionActivityRegistry,
    });
    return await this.get('store').findRecord(
      'openfaasFunctionActivityRegistry',
      activityRegistryGri, { reload, backgroundReload }
    );
  },

  /**
   * @param {string} atmStoreInstanceId
   * @param {string} startFromIndex
   * @param {number} limit
   * @param {number} offset
   * @returns {Promise<{array: Array<StoreContentEntry>, isLast: boolean}>}
   */
  async getAtmStoreContent(atmStoreInstanceId, startFromIndex, limit, offset) {
    const atmStore = await this.getAtmStoreById(atmStoreInstanceId);
    const atmStoreType = get(atmStore, 'type');
    const browseOptions = createAtmStoreContentBrowseOptions(
      atmStoreType,
      startFromIndex,
      limit,
      offset
    );
    if (!browseOptions) {
      return emptyAtmStoreContent;
    }

    const storeContentGri = gri({
      entityType: atmStoreEntityType,
      entityId: atmStoreInstanceId,
      aspect: 'content',
    });

    try {
      const content = await this.get('onedataGraph').request({
        gri: storeContentGri,
        operation: 'get',
        data: {
          options: browseOptions,
        },
        subscribe: false,
      });
      return normalizeAtmStoreContent(atmStoreType, content);
    } catch (error) {
      if (error && error.id === 'atmStoreEmpty') {
        return emptyAtmStoreContent;
      } else {
        throw error;
      }
    }
  },

  /**
   * @param {String} atmWorkflowExecutionId
   * @param {String} atmLaneId
   * @param {AtmLaneRunNumber} runNumber
   */
  async retryAtmLane(atmWorkflowExecutionId, atmLaneId, runNumber) {
    const retryGri = gri({
      entityType: atmWorkflowExecutionEntityType,
      entityId: atmWorkflowExecutionId,
      aspect: 'retry',
      scope: 'private',
    });
    await this.get('onedataGraph').request({
      gri: retryGri,
      operation: 'create',
      subscribe: false,
      data: {
        laneSchemaId: atmLaneId,
        laneRunNumber: runNumber,
      },
    });
  },

  /**
   * @param {String} atmWorkflowExecutionId
   * @param {String} atmLaneId
   * @param {AtmLaneRunNumber} runNumber
   */
  async rerunAtmLane(atmWorkflowExecutionId, atmLaneId, runNumber) {
    const rerunGri = gri({
      entityType: atmWorkflowExecutionEntityType,
      entityId: atmWorkflowExecutionId,
      aspect: 'rerun',
      scope: 'private',
    });
    await this.get('onedataGraph').request({
      gri: rerunGri,
      operation: 'create',
      subscribe: false,
      data: {
        laneSchemaId: atmLaneId,
        laneRunNumber: runNumber,
      },
    });
  },

  /**
   * @param {string} atmTaskExecutionId
   * @param {string} podId
   * @param {JsonInfiniteLogPagingParams} pagingParams
   * @returns {Promise<JsonInfiniteLogPage<OpenfaasFunctionEvent>>}
   */
  async getAtmTaskExecutionOpenfaasPodEventLogs(
    atmTaskExecutionId,
    podId,
    pagingParams
  ) {
    const eventLogGri = gri({
      entityType: atmTaskExecutionEntityType,
      entityId: atmTaskExecutionId,
      aspect: atmTaskExecutionAspects.openfaasFunctionPodEventLog,
      aspectId: podId,
    });
    return this.get('infiniteLogManager').getJsonInfiniteLogContent(
      eventLogGri,
      pagingParams
    );
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

/**
 * @param {string} atmStoreType
 * @param {string|null} startFromIndex
 * @param {number} limit
 * @param {number} offset
 * @returns {Object|null} returns null if browse operation should not be performed
 *   due to incorrect parameters
 */
function createAtmStoreContentBrowseOptions(atmStoreType, startFromIndex, limit, offset) {
  if (!limit || limit <= 0) {
    return null;
  }

  const browseOptions = {
    type: `${atmStoreType}StoreContentBrowseOptions`,
  };

  if (['list', 'treeForest', 'auditLog'].includes(atmStoreType)) {
    browseOptions.index = startFromIndex;
    browseOptions.offset = offset;
    browseOptions.limit = limit;
  } else if (startFromIndex !== null || offset !== 0) {
    return null;
  }

  return browseOptions;
}

/**
 * @param {string} atmStoreType
 * @param {unknown} content
 * @returns {{array: Array<StoreContentEntry>, isLast: boolean}}
 */
function normalizeAtmStoreContent(atmStoreType, content) {
  if (!content) {
    return emptyAtmStoreContent;
  }

  switch (atmStoreType) {
    case 'auditLog': {
      const { logs = [], isLast = true } = content;
      return { array: logs, isLast };
    }
    case 'list': {
      const { items = [], isLast = true } = content;
      return { array: items, isLast };
    }
    case 'range': {
      return {
        array: [{
          index: '0',
          success: true,
          value: content,
        }],
        isLast: true,
      };
    }
    case 'singleValue': {
      return {
        array: [Object.assign({ index: '0' }, content)],
        isLast: true,
      };
    }
    case 'treeForest': {
      const { treeRoots = [], isLast = true } = content;
      return { array: treeRoots, isLast };
    }
    default:
      return emptyAtmStoreContent;
  }
}
