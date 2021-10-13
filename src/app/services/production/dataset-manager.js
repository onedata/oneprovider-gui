/**
 * Provides model functions related to datasets.
 *
 * @module services/dataset-manager
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service from '@ember/service';
import { allSettled } from 'rsvp';
import { get, set } from '@ember/object';
import { inject as service } from '@ember/service';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { entityType as spaceEntityType } from 'oneprovider-gui/models/space';
import { entityType as datasetEntityType } from 'oneprovider-gui/models/dataset';
import BrowsableDataset from 'oneprovider-gui/utils/browsable-dataset';

const spaceDatasetsAspect = 'datasets_details';
const datasetChildrenAspect = 'children_details';

export default Service.extend({
  onedataGraph: service(),
  store: service(),
  fileManager: service(),

  /**
   * Mapping of `datasetId` -> cached browsable-wrapped dataset
   * @type {Object}
   */
  browsableDatasetsStore: undefined,

  init() {
    this._super(...arguments);
    this.set('browsableDatasetsStore', {});
  },

  /**
   * @param {String} datasetId entityId of dataset
   * @param {String} scope currently only 'private' is supported
   * @returns {Promise<Models.Dataset>}
   */
  async getDataset(datasetId, scope = 'private') {
    const requestGri = gri({
      entityType: datasetEntityType,
      entityId: datasetId,
      aspect: 'instance',
      scope,
    });
    return this.get('store').findRecord('dataset', requestGri);
  },

  /**
   * Creates or returns previously created BrowsableDataset object.
   * Only one `BrowsableDataset` for specific `datasetId` is created.
   * @param {String|Models.Dataset} datasetOrEntityId
   * @returns {Utils.BrowsableArchive}
   */
  async getBrowsableDataset(datasetOrEntityId) {
    let datasetId;
    let dataset;
    if (typeof (datasetOrEntityId) === 'string') {
      datasetId = datasetOrEntityId;
    } else {
      datasetId = get(datasetOrEntityId, 'entityId');
      dataset = datasetOrEntityId;
    }
    const browsableDatasetsStore = this.get('browsableDatasetsStore');
    const cachedBrowsableDataset = browsableDatasetsStore[datasetId];
    if (cachedBrowsableDataset) {
      return cachedBrowsableDataset;
    } else {
      if (!dataset) {
        dataset = await this.getDataset(datasetId);
      }
      const browsableDataset = BrowsableDataset.create({
        content: dataset,
      });
      browsableDatasetsStore[datasetId] = browsableDataset;
      return browsableDataset;
    }
  },

  /**
   * @param {Models.File} file
   * @returns {Promise<Models.Dataset>}
   */
  async establishDataset(file) {
    const store = this.get('store');
    const dataset = store.createRecord('dataset', {
      _meta: {
        additionalData: {
          rootFileId: get(file, 'cdmiObjectId'),
          // also protectionFlags can be specified here, but we don't use this
        },
      },
    });
    await dataset.save();
    await this.updateFileDatasetsData(file);
    return dataset;
  },

  /**
   * @param {Models.Dataset} dataset
   */
  async destroyDataset(dataset) {
    const isAttached = get(dataset, 'state') === 'attached';
    const fileRelation = isAttached ? dataset.belongsTo('rootFile') : null;
    await dataset.destroyRecord();
    // if file is not attached, updating file is redundant (and causes problems when
    // source file has been deleted)
    if (isAttached && fileRelation && fileRelation.id()) {
      try {
        const file = await fileRelation.load();
        if (file) {
          await this.updateFileDatasetsData(file);
        }
      } catch (error) {
        // tolerating file not found error, because it is only file update
        if (!isEnoentError(error)) {
          throw error;
        }
      }
    }
  },

  /**
   * @param {Models.Dataset} dataset
   * @param {Boolean} attach whether dataset should be active for its rootFile
   * @returns {Promise<Models.Dataset>}
   */
  async toggleDatasetAttachment(dataset, attach) {
    set(dataset, 'state', attach ? 'attached' : 'detached');
    await dataset.save();
    const fileRelation = dataset.belongsTo('rootFile');
    if (fileRelation && fileRelation.id()) {
      const file = await fileRelation.load();
      if (file) {
        await this.updateFileDatasetsData(file);
      }
    }
    return dataset;
  },

  /**
   * Toggle single flag - if you want to change multiple flags at once use
   * `changeMultipleDatasetProtectionFlags`.
   * @param {Models.Dataset} dataset
   * @param {String} flag name, eg. `metadata_protection`
   * @param {Boolean} state true if flag should be set, false if should be unset
   * @returns {Promise<Models.Dataset>}
   */
  async toggleDatasetProtectionFlag(dataset, flag, state) {
    const setProtectionFlags = [];
    const unsetProtectionFlags = [];
    if (state) {
      setProtectionFlags.push(flag);
    } else {
      unsetProtectionFlags.push(flag);
    }
    return await this.changeMultipleDatasetProtectionFlags(
      dataset,
      setProtectionFlags,
      unsetProtectionFlags
    );
  },

  /**
   * @param {Models.Dataset} dataset
   * @param {Array<String>} setProtectionFlags
   * @param {Array<String>} unsetProtectionFlags
   * @returns {Promise<Models.Dataset>}
   */
  async changeMultipleDatasetProtectionFlags(
    dataset,
    setProtectionFlags = [],
    unsetProtectionFlags = []
  ) {
    const onedataGraph = this.get('onedataGraph');
    const gri = get(dataset, 'gri');
    await onedataGraph.request({
      gri,
      operation: 'update',
      data: {
        setProtectionFlags,
        unsetProtectionFlags,
      },
    });
    await this.updateDatasetData(dataset);
    const file = await get(dataset, 'rootFile');
    if (file) {
      this.updateFileDatasetsData(file);
    }
    return dataset;
  },

  async updateDatasetData(dataset) {
    const fileManager = this.get('fileManager');
    const promises = [
      dataset.reload(),
    ];
    if (get(dataset, 'rootFileType') === 'dir') {
      promises.push(
        fileManager.dirChildrenRefresh(get(dataset, 'entityId'))
      );
    }
    await allSettled(promises);
  },

  async updateFileDatasetsData(file) {
    const fileManager = this.get('fileManager');
    const fileDatasetSummaryRelation = file.belongsTo('fileDatasetSummary');
    const promises = [
      file.reload(),
      fileDatasetSummaryRelation.reload(),
    ];
    if (get(file, 'type') === 'dir') {
      promises.push(
        fileManager.dirChildrenRefresh(get(file, 'entityId'))
      );
    }
    await allSettled(promises);
  },

  /**
   * @param {String} parentType one of: space, dataset
   * @param {String} parentId entityId of space or dataset to list its dataset children
   * @param {String} state one of: attached, detached
   * @param {String} index
   * @param {Number} limit
   * @param {Number} offset
   * @returns {Promise<{ childrenRecords: Array<Models.Dataset>, isLast: Boolean }>}
   */
  async fetchChildrenDatasets({
    parentType,
    parentId,
    state,
    scope = 'private',
    index,
    limit,
    offset,
  }) {
    if (!limit || limit <= 0) {
      return { childrenRecords: [], isLast: false };
    } else {
      return this.fetchChildrenAttrs({
        parentType,
        parentId,
        scope,
        state,
        index,
        limit,
        offset,
      }).then(async ({ datasets, isLast }) => {
        const childrenRecords = await this.pushChildrenAttrsToStore(
          datasets,
          scope,
        );
        return { childrenRecords, isLast };
      });
    }
  },

  /**
   * @param {Array<Object>} childrenAttrs data for creating Dataset model
   * @param {String} [scope='private'] currently only private is supported
   * @returns {Promise<Array<Model>>}
   */
  async pushChildrenAttrsToStore(childrenAttrs, scope = 'private') {
    const store = this.get('store');
    return childrenAttrs.map(attrsData => {
      attrsData.scope = scope;
      const modelData = store.normalize('dataset', attrsData);
      return store.push(modelData);
    });
  },

  /**
   * @param {String} parentType one of: space, dataset
   * @param {String} parentId entityId of space or dataset to list its children datasets
   * @param {String} state one of: attached, detached
   * @param {String} [scope='private'] currently only private is supported
   * @param {String} index
   * @param {Number} limit
   * @param {Number} offset
   * @returns {Promise<{ datasets: Array, isLast: Boolean }>}
   */
  async fetchChildrenAttrs({
    parentType,
    parentId,
    state,
    scope = 'private',
    index,
    limit,
    offset,
  }) {
    const entityType = {
      space: spaceEntityType,
      dataset: datasetEntityType,
    } [parentType];
    const aspect = {
      space: spaceDatasetsAspect,
      dataset: datasetChildrenAspect,
    } [parentType];
    if (!entityType || !parentType) {
      throw new Error(
        'service:dataset-manager#fetchChildrenAttrs: invalid parentType specified:',
        parentType
      );
    }
    const requestGri = gri({
      entityId: parentId,
      entityType,
      aspect,
      scope,
    });
    return this.get('onedataGraph').request({
      operation: 'get',
      gri: requestGri,
      data: {
        state,
        index,
        limit,
        offset,
      },
      subscribe: false,
    });
  },
});

function isEnoentError(error) {
  return error && error.id === 'posix' && error.details &&
    error.details.errno === 'enoent';
}
