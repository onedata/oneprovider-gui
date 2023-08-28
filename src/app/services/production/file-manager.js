/**
 * Provides model functions related to files and directories.
 *
 * @author Michał Borzęcki, Jakub Liput
 * @copyright (C) 2019-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { resolve, allSettled, all as allFulfilled, hash as hashFulfilled, hashSettled } from 'rsvp';
import { get, set, computed } from '@ember/object';
import gri from 'onedata-gui-websocket-client/utils/gri';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import _ from 'lodash';
import {
  entityType as fileEntityType,
  getFileGri,
  dirSizeStatsTimeSeriesNameGenerators,
} from 'oneprovider-gui/models/file';
import { getSpaceIdFromGuid } from 'onedata-gui-common/utils/file-guid-parsers';
import { generateAbsoluteSymlinkPathPrefix } from 'oneprovider-gui/utils/symlink-utils';
import { later } from '@ember/runloop';
import createThrottledFunction from 'onedata-gui-common/utils/create-throttled-function';
import { getTimeSeriesMetricNamesWithAggregator } from 'onedata-gui-common/utils/time-series';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';

/**
 * @typedef {Object} FileEntryTimeSeriesCollections
 * @param {Array<string>} dir_count
 * @param {Array<string>} incarnation
 * @param {Array<string>} reg_file_and_link_count
 * @param {Array<string>} storage_use_<id>
 * @param {Array<string>} total_size
 */

export const SpaceSizeStatsType = Object.freeze({
  All: 'all',
  RegularData: 'regularData',
  Archives: 'archives',
  Trash: 'trash',
});

/**
 * @typedef {'all'|'regularData'|'archives'|'trash'} SpaceSizeStatsType
 */

/**
 * @typedef {Object} SpaceCurrentSizeStats
 * @property {DirCurrentSizeStats} all
 * @property {DirCurrentSizeStats} regularData
 * @property {DirCurrentSizeStats} archives
 * @property {DirCurrentSizeStats} trash
 */

/**
 * @typedef {Object<string, DirCurrentSizeStatsForProvider>} DirCurrentSizeStats
 * Mapping providerId -> dir current size stats for that provider.
 */

/**
 * @typedef {DirCurrentSizeStatsResultForProvider | DirCurrentSizeStatsErrorForProvider} DirCurrentSizeStatsForProvider
 */

/**
 * @typedef {Object} DirCurrentSizeStatsResultForProvider
 * @property {'result'} type
 * @property {number} regFileAndLinkCount
 * @property {number} dirCount
 * @property {number} logicalSize
 * @property {number} totalPhysicalSize
 * @property {Object<string, number>} physicalSizePerStorage
 *   mapping storageId -> (physical size on storage)
 */

/**
 * @typedef {Object} DirCurrentSizeStatsErrorForProvider
 * @property {'error'} type
 * @property {Object} error
 */

/**
 * @typedef {Object} RecallAuditLogEntryContent
 * @property {string|null} fileId CDMI Object ID of file that message is about
 * @property {string|null} relativePath relative path to error-affected file from archive
 * @property {RecallError} reason object with error reason
 */

/**
 * An error object from backend in standard format, parsable using ErrorExtractor
 * @typedef {RecallError} Object
 */

const cancelRecallAspect = 'cancel_archive_recall';
const childrenAttrsAspect = 'children_details';
const symlinkTargetAttrsAspect = 'symlink_target';
const recallLogAspect = 'archive_recall_log';
const fileModelName = 'file';

export default Service.extend({
  store: service(),
  onedataRpc: service(),
  onedataGraph: service(),
  timeSeriesManager: service(),
  auditLogManager: service(),
  apiSamplesManager: service(),
  userManager: service(),
  spaceManager: service(),
  storageManager: service(),
  providerManager: service(),

  /**
   * @type {Array<Ember.Component>}
   */
  fileTableComponents: computed(() => []),

  /**
   * keys: parent dir entity ids (string), values: throttled functions
   * @type {ComputedProperty<Object>}
   */
  throttledDirChildrenRefreshCallbacks: computed(() => ({})),

  /**
   * @param {String} fileId
   * @param {Object} options
   * @param {'private'|'public'} [options.scope='private']
   * @param {Boolean} [options.reload=false] a `findRecord` option
   * @param {Boolean} [options.backgroundReload=false] a `findRecord` option
   * @returns {Promise<Models.File>}
   */
  async getFileById(fileId, {
    scope = 'private',
    reload = false,
    backgroundReload = false,
  } = {}) {
    const store = this.get('store');
    const fileGri = getFileGri(fileId, scope);
    const file = await store.findRecord(
      fileModelName,
      fileGri, {
        reload,
        backgroundReload,
      }
    );
    await this.resolveSymlinks([file], scope);
    return file;
  },

  async getFileByName(parentDirId, fileName, scope = 'private') {
    const data = await this.fetchDirChildren(
      parentDirId,
      scope,
      fileName,
      1,
    );
    const file = data.childrenRecords[0];
    if (file && file.name === fileName) {
      return file;
    } else {
      return null;
    }
  },

  /**
   * Creates child element in given directory.
   * @param {Models.File} directory
   * @param {String} type
   * @param {String} name
   * @param {Object|undefined} creationOptions
   * @returns {Promise<Models.File>}
   */
  createDirectoryChild(directory, type, name, creationOptions = undefined) {
    const _meta = creationOptions && Object.keys(creationOptions).length ? {
      additionalData: creationOptions,
    } : undefined;

    return this.get('store').createRecord(fileModelName, {
      type,
      name,
      parent: directory,
      _meta,
    }).save();
  },

  /**
   * Creates new file or directory
   * @param {string} type `file` or `dir`
   * @param {string} name
   * @param {Models.File} parent
   * @param {number} [createAttempts=undefined]
   * @returns {Promise<Models.File>}
   */
  createFileOrDirectory(type, name, parent, createAttempts = undefined) {
    const creationOptions = createAttempts ? { createAttempts } : undefined;
    return this.createDirectoryChild(parent, type, name, creationOptions);
  },

  /**
   * Creates new file
   * @param {string} name
   * @param {Models.File} parent
   * @param {number} [createAttempts=undefined]
   * @returns {Promise<Models.File>}
   */
  createFile(name, parent, createAttempts = undefined) {
    return this.createFileOrDirectory(fileModelName, name, parent, createAttempts);
  },

  /**
   * Creates new directory
   * @param {string} name
   * @param {Models.File} parent
   * @param {number} [createAttempts=undefined]
   * @returns {Promise<Models.File>}
   */
  createDirectory(name, parent, createAttempts = undefined) {
    return this.createFileOrDirectory('dir', name, parent, createAttempts);
  },

  /**
   * Creates new symlink to a given path
   * @param {String} name
   * @param {Models.File} parent
   * @param {String} targetPath must be an absolute path
   * @param {String} spaceId
   * @param {Number} [createAttempts=undefined]
   * @returns {Promise<Models.File>}
   */
  createSymlink(name, parent, targetPath, spaceId, createAttempts = undefined) {
    // Removing `/spacename` prefix from targetPath. Example '/s1/a/b' -> 'a/b'
    const absolutePathWithoutSpace = targetPath.split('/').slice(2).join('/');
    const pathPrefix = generateAbsoluteSymlinkPathPrefix(spaceId);
    const options = {
      targetPath: `${pathPrefix}/${absolutePathWithoutSpace}`,
    };
    if (createAttempts) {
      options.createAttempts = createAttempts;
    }

    return this.createDirectoryChild(parent, 'symlink', name, options);
  },

  /**
   * Creates new hardlink to a given file
   * @param {String} name
   * @param {Models.File} parent
   * @param {Models.File} target
   * @param {Number} [createAttempts=undefined]
   * @returns {Promise<Models.File>}
   */
  createHardlink(name, parent, target, createAttempts = undefined) {
    const options = {
      targetGuid: get(target, 'entityId'),
    };
    if (createAttempts) {
      options.createAttempts = createAttempts;
    }
    return this.createDirectoryChild(parent, 'hardlink', name, options);
  },

  /**
   * Sends an RPC call that initializes upload of given file.
   * @param {Models.File} file
   * @returns {Promise}
   */
  initializeFileUpload(file) {
    return this.get('onedataRpc').request('initializeFileUpload', {
      guid: get(file, 'entityId'),
    });
  },

  /**
   * Sends an RPC call that ends upload of given file.
   * @param {Models.File} file
   * @returns {Promise}
   */
  finalizeFileUpload(file) {
    return this.get('onedataRpc').request('finalizeFileUpload', {
      guid: get(file, 'entityId'),
    });
  },

  /**
   * @param {String} dirId entityId of parent dir
   * @param {String} scope one of: private, public
   * @param {String} index file.index that the listing should start
   * @param {Number} limit
   * @param {Number} offset
   * @returns {Promise<{ childrenRecords: Array<Models.File>, isLast: Boolean }>}
   */
  fetchDirChildren(dirId, scope, index, limit, offset) {
    if (!limit || limit <= 0) {
      return resolve({ childrenRecords: [], isLast: false });
    } else {
      return this.fetchChildrenAttrs({
        dirId,
        scope,
        index,
        limit,
        offset,
      }).then(({ children, isLast }) =>
        this.pushChildrenAttrsToStore(children, scope)
        .then(childrenRecords =>
          this.resolveSymlinks(childrenRecords, scope).then(() => childrenRecords)
        )
        .then(childrenRecords => ({ childrenRecords, isLast }))
      );
    }
  },

  /**
   * @param {Array<Object>} childrenAttrs data for creating File model
   * @param {String} scope one of: private, public
   * @returns {Array<Record>}
   */
  pushChildrenAttrsToStore(childrenAttrs, scope) {
    const store = this.get('store');
    return resolve(childrenAttrs.map(fileAttrs => {
      fileAttrs.scope = scope;
      const modelData = store.normalize(fileModelName, fileAttrs);
      return store.push(modelData);
    }));
  },

  /**
   * @returns {Promise<{ children: Array, isLast: Boolean }>}
   */
  fetchChildrenAttrs({ dirId, scope, index, limit, offset }) {
    const requestGri = gri({
      entityId: dirId,
      entityType: fileEntityType,
      aspect: childrenAttrsAspect,
      scope,
    });
    return this.get('onedataGraph').request({
      operation: 'get',
      gri: requestGri,
      data: {
        index,
        limit,
        offset,
        inclusive: true,
        // TODO: VFS-11089 Use that attributes in smarter way
        // attributes: [
        //   'activePermissionsType',
        //   'archiveId',
        //   'atime',
        //   'conflictingFiles',
        //   'conflictingName',
        //   'ctime',
        //   'effDatasetMembership',
        //   'effDatasetProtectionFlags',
        //   'effProtectionFlags',
        //   'effQosMembership',
        //   'fileId',
        //   'hardlinksCount',
        //   'hasMetadata',
        //   'index',
        //   'isFullyReplicated',
        //   'isDeleted',
        //   'localReplicationRate',
        //   'mtime',
        //   'name',
        //   'ownerId',
        //   'parentId',
        //   'posixPermissions',
        //   'providerId',
        //   'qosStatus',
        //   'recallRootId',
        //   'shares',
        //   'size',
        //   'storageGroupId',
        //   'storageUserId',
        //   'symlinkValue',
        //   'type',
        // ],
      },
      subscribe: false,
    });
  },

  resolveSymlinks(files, scope) {
    const symlinks = files.filterBy('type', 'symlink');
    return allFulfilled(symlinks.map(symlink =>
      this.fetchSymlinkTargetAttrs(get(symlink, 'entityId'), scope)
      .then(targetAttrs => this.pushChildrenAttrsToStore([targetAttrs], scope))
      .then(([targetRecord]) => set(symlink, 'symlinkTargetFile', targetRecord))
      .catch(() => set(symlink, 'symlinkTargetFile', null))
    ));
  },

  /**
   * @param {String} symlinkEntityId
   * @param {String} scope
   * @returns {Promise<Object>} attributes of symlink target
   */
  fetchSymlinkTargetAttrs(symlinkEntityId, scope) {
    const requestGri = gri({
      entityId: symlinkEntityId,
      entityType: fileEntityType,
      aspect: symlinkTargetAttrsAspect,
      scope,
    });
    return this.get('onedataGraph').request({
      operation: 'get',
      gri: requestGri,
      subscribe: false,
    });
  },

  renameFile(file, targetName) {
    return this.get('onedataRpc').request('moveFile', {
      guid: get(file, 'entityId'),
      targetParentGuid: file.relationEntityId('parent'),
      targetName,
    });
  },

  copyFile(file, parentDirEntityId) {
    return this.copyOrMoveFile(file, parentDirEntityId, 'copy');
  },

  moveFile(file, parentDirEntityId) {
    return this.copyOrMoveFile(file, parentDirEntityId, 'move');
  },

  async copyOrMoveFile(file, parentDirEntityId, operation) {
    const name = get(file, 'name') || 'unknown';
    const entityId = get(file, 'entityId');
    const size = get(file, 'size');
    const getFileAttempts = 1000;
    const getFileInterval = 500;

    try {
      const promise = this.onedataRpc.request(`${operation}File`, {
        guid: entityId,
        targetParentGuid: parentDirEntityId,
        targetName: name,
      });
      this.pollForFileAfterOperation(
        getFileAttempts,
        getFileInterval,
        parentDirEntityId,
        name,
        size,
        operation,
        promiseObject(promise),
      );
      await promise;
    } finally {
      const file = await this.getFileByName(parentDirEntityId, name);
      if (file) {
        this.dirChildrenRefresh(parentDirEntityId);
        set(file, 'isCopyingMovingStop', true);
      }
    }
  },

  getFileDownloadUrl(fileIds, scope = 'private') {
    return this.get('onedataGraph').request({
      operation: 'get',
      gri: gri({
        entityType: fileEntityType,
        entityId: null,
        aspect: 'download_url',
        scope,
      }),
      data: {
        file_ids: fileIds,
      },
      subscribe: false,
    });
  },

  getFileApiSamples(fileId, scope = 'private') {
    const apiSamplesManager = this.get('apiSamplesManager');
    return apiSamplesManager.getApiSamples(fileId, 'file', scope);
  },

  async getFileHardlinks(fileId, limit = 100) {
    const idsResult = await this.get('onedataGraph').request({
      operation: 'get',
      gri: gri({
        entityType: fileEntityType,
        entityId: fileId,
        aspect: 'hardlinks',
        scope: 'private',
      }),
      subscribe: false,
      data: {
        limit,
      },
    });
    const hardlinksIds = idsResult.hardlinks || [];
    return allSettled(
      hardlinksIds.map(hardlinkId =>
        this.getFileById(parseGri(hardlinkId).entityId))
    ).then(results => ({
      hardlinksCount: hardlinksIds.length,
      hardlinks: results.filterBy('state', 'fulfilled').mapBy('value'),
      errors: results.filterBy('state', 'rejected').mapBy('reason'),
    }));
  },

  async areFilesHardlinked(fileRecordOrIdA, fileRecordOrIdB) {
    const isRecordA = fileRecordOrIdA && typeof fileRecordOrIdA !== 'string';
    const isRecordB = fileRecordOrIdB && typeof fileRecordOrIdB !== 'string';

    if (fileRecordOrIdA === fileRecordOrIdB) {
      return false;
    }
    if (isRecordA && get(fileRecordOrIdA, 'type') === 'dir') {
      return false;
    }
    if (isRecordB && get(fileRecordOrIdB, 'type') === 'dir') {
      return false;
    }
    if (!fileRecordOrIdA || !fileRecordOrIdB) {
      throw new Error(
        'service:file-manager#areFilesHardlinked: at least one of params is empty'
      );
    }
    if (isRecordA && isRecordB) {
      const hardlinksCountA = get(fileRecordOrIdA, 'hardlinksCount');
      const hardlinksCountB = get(fileRecordOrIdB, 'hardlinksCount');
      // checking if both counts are greater than 1 because data can be out of sync with
      // backend
      if (
        hardlinksCountA && hardlinksCountA <= 1 &&
        hardlinksCountB && hardlinksCountB <= 1
      ) {
        return false;
      }
    }

    const fileIdA = isRecordA ? get(fileRecordOrIdA, 'entityId') : fileRecordOrIdA;
    const fileIdB = isRecordB ? get(fileRecordOrIdB, 'entityId') : fileRecordOrIdB;

    try {
      await this.get('onedataGraph').request({
        operation: 'get',
        gri: gri({
          entityType: fileEntityType,
          entityId: fileIdA,
          aspect: 'hardlinks',
          aspectId: fileIdB,
          scope: 'private',
        }),
        subscribe: false,
      });
      // above method just passes if files are hardlinks and throws with notFound if not
      return true;
    } catch (error) {
      if (error && error.id === 'notFound') {
        return false;
      } else {
        throw error;
      }
    }
  },

  async getFileDataByName(parentDirId, fileName, fetchOptions = {}) {
    const attrs = await this.fetchChildrenAttrs(Object.assign({
      dirId: parentDirId,
      scope: 'private',
      index: fileName,
      limit: 1,
      offset: 0,
    }, fetchOptions));
    return attrs && attrs.children && attrs.children[0] || null;
  },

  async checkFileNameExists(parentDirId, fileName, scope = 'private') {
    const file = await this.getFileDataByName(parentDirId, fileName, { scope });
    if (file) {
      return file.name === fileName || file.conflictingName === fileName;
    } else {
      return false;
    }
  },

  /**
   * @returns {Promise<TimeSeriesCollectionSchema>}
   */
  async getDirSizeStatsTimeSeriesCollectionSchema() {
    const requestGri = gri({
      entityId: 'null',
      entityType: fileEntityType,
      aspect: 'dir_size_stats_collection_schema',
      scope: 'public',
    });
    return this.timeSeriesManager.getTimeSeriesCollectionSchema(requestGri);
  },

  /**
   * @param {string} fileId
   * @param {string} providerId
   * @param {{reload: boolean}} [options]
   * @returns {Promise<TimeSeriesCollectionLayout>}
   */
  async getDirSizeStatsTimeSeriesCollectionLayout(
    fileId,
    providerId, { reload = false } = {}
  ) {
    const requestGri = dirSizeStatsGri(fileId, providerId);
    return this.timeSeriesManager.getTimeSeriesCollectionLayout(requestGri, { reload });
  },

  /**
   * @param {string} spaceId
   * @param {string} providerId
   * @param {SpaceSizeStatsType} statsType
   * @param {{reload: boolean}} [options]
   * @returns {Promise<TimeSeriesCollectionLayout>}
   */
  async getSpaceSizeStatsTimeSeriesCollectionLayout(
    spaceId,
    providerId,
    statsType,
    options,
  ) {
    const space = await this.spaceManager.getSpace(spaceId);
    const rootDirId = space.relationEntityId('rootDir');
    const archivesDirId = get(space, 'archivesDirId');
    const trashDirId = get(space, 'trashDirId');
    const getLayout = (dirId) => this.getDirSizeStatsTimeSeriesCollectionLayout(
      dirId,
      providerId,
      statsType,
      options
    );
    if (statsType === SpaceSizeStatsType.Archives) {
      return getLayout(archivesDirId);
    } else if (statsType === SpaceSizeStatsType.Trash) {
      return getLayout(trashDirId);
    } else {
      return getLayout(rootDirId);
    }
  },

  /**
   * @param {string} fileId
   * @param {string} providerId
   * @param {TimeSeriesCollectionSliceQueryParams} queryParams
   * @returns {Promise<TimeSeriesCollectionSlice>}
   */
  async getDirSizeStatsTimeSeriesCollectionSlice(fileId, providerId, queryParams) {
    const requestGri = dirSizeStatsGri(fileId, providerId);
    return this.timeSeriesManager.getTimeSeriesCollectionSlice(requestGri, queryParams);
  },

  /**
   *
   * @param {string} spaceId
   * @param {string} providerId
   * @param {SpaceSizeStatsType} statsType
   * @param {TimeSeriesCollectionSliceQueryParams} queryParams
   * @returns {Promise<TimeSeriesCollectionSlice>}
   */
  async getSpaceSizeStatsTimeSeriesCollectionSlice(
    spaceId,
    providerId,
    statsType,
    queryParams
  ) {
    const space = await this.spaceManager.getSpace(spaceId);
    const rootDirId = space.relationEntityId('rootDir');
    const archivesDirId = get(space, 'archivesDirId');
    const trashDirId = get(space, 'trashDirId');
    const getStats = (dirId) => this.getDirSizeStatsTimeSeriesCollectionSlice(
      dirId,
      providerId,
      queryParams
    );
    if (statsType === SpaceSizeStatsType.All) {
      return getStats(rootDirId);
    } else if (statsType === SpaceSizeStatsType.Archives) {
      return getStats(archivesDirId);
    } else if (statsType === SpaceSizeStatsType.Trash) {
      return getStats(trashDirId);
    }

    // To calculate regular data stats, we need to calculate `all - archives - trash`.
    const [allStats, archivesStats, trashStats] = await allFulfilled([
      getStats(rootDirId),
      getStats(archivesDirId),
      getStats(trashDirId),
    ]);
    const result = {};
    // Iterate over all series
    for (const seriesName in allStats) {
      result[seriesName] = {};
      // Iterate over all metrics in every series
      for (const metricName in allStats[seriesName]) {
        const metricsToSubtract = [
          archivesStats[seriesName]?.[metricName]?.reverse() ?? [],
          trashStats[seriesName]?.[metricName]?.reverse() ?? [],
        ];
        const regularDataMetric =
          _.cloneDeep(allStats[seriesName][metricName])?.reverse() ?? [];
        result[seriesName][metricName] = regularDataMetric;
        if (!regularDataMetric.length) {
          continue;
        }
        const oldestTimestamp = regularDataMetric[0].timestamp;
        for (const metricToSubtract of metricsToSubtract) {
          if (!metricToSubtract.length) {
            continue;
          }
          let idxOfFirstPoint = 0;
          while (metricToSubtract[idxOfFirstPoint + 1]?.timestamp <= oldestTimestamp) {
            idxOfFirstPoint++;
          }
          metricToSubtract.splice(0, idxOfFirstPoint);
          if (idxOfFirstPoint === 0 && metricToSubtract[0].timestamp > oldestTimestamp) {
            metricToSubtract.unshift({
              timestamp: oldestTimestamp,
              value: 0,
              firstMeasurementTimestamp: null,
              lastMeasurementTimestamp: null,
            });
          }

          // In the loop below we calculate new regular data values by
          // subtracting points from `metricToSubtract`. Points in regular data
          // and in metric to subtract can have different timestamps. Hence we
          // insert any missing timestamp in regularData/metricToSubtract in
          // every iteration.
          let idxInRegularDataMetric = 0;
          let idxInSubtractMetric = 0;
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const currentRegularPoint =
              _.cloneDeep(regularDataMetric[idxInRegularDataMetric]);
            // Subtract points. Using Math.min to avoid reaching negative values
            regularDataMetric[idxInRegularDataMetric].value -= Math.min(
              metricToSubtract[idxInSubtractMetric].value,
              regularDataMetric[idxInRegularDataMetric].value
            );
            // Possible points for next iteration
            const nextPointInRegular = regularDataMetric[idxInRegularDataMetric + 1];
            const nextPointInSubtract = metricToSubtract[idxInSubtractMetric + 1];
            if (!nextPointInRegular && !nextPointInSubtract) {
              // Reached end of both arrays - stop iteration.
              break;
            } else if (
              !nextPointInRegular ||
              (
                nextPointInSubtract &&
                nextPointInRegular.timestamp > nextPointInSubtract.timestamp
              )
            ) {
              // Regular data has no points left or its next point is newer that
              // the next point in `metricToSubtract`. We need to create new point
              // in regular data.
              regularDataMetric.splice(idxInRegularDataMetric + 1, 0, {
                ...currentRegularPoint,
                timestamp: nextPointInSubtract.timestamp,
                firstMeasurementTimestamp: null,
                lastMeasurementTimestamp: null,
              });
            } else if (
              !nextPointInSubtract ||
              (
                nextPointInRegular &&
                nextPointInSubtract.timestamp > nextPointInRegular.timestamp
              )
            ) {
              // `metricToSubtract` has no points left or its next point is newer that
              // the next point in regular data. We need to create new point
              // in `metricToSubtract`.
              metricToSubtract.splice(idxInSubtractMetric + 1, 0, {
                ...metricToSubtract[idxInSubtractMetric],
                timestamp: nextPointInRegular.timestamp,
                firstMeasurementTimestamp: null,
                lastMeasurementTimestamp: null,
              });
            }
            idxInRegularDataMetric++;
            idxInSubtractMetric++;
          }
        }
        regularDataMetric.reverse();
      }
    }
    return result;
  },

  /**
   * @param {string} fileId
   * @returns {DirCurrentSizeStats|null}
   */
  async getDirCurrentSizeStats(fileId) {
    const spaceId = getSpaceIdFromGuid(fileId);
    if (
      (await this.spaceManager.getDirStatsServiceState(spaceId))?.status !== 'enabled'
    ) {
      return null;
    }

    const space = await this.spaceManager.getSpace(spaceId);
    const providerIds = (await get(space, 'providerList')).hasMany('list').ids()
      .map((providerGri) => parseGri(providerGri).entityId);

    const [collectionSchema, perProviderCollectionLayout] = await allFulfilled([
      this.getDirSizeStatsTimeSeriesCollectionSchema(),
      hashSettled(providerIds.reduce((acc, providerId) => {
        acc[providerId] =
          this.getDirSizeStatsTimeSeriesCollectionLayout(fileId, providerId);
        return acc;
      }, {})),
    ]);

    const neededTimeSeriesNameGenerators = [
      dirSizeStatsTimeSeriesNameGenerators.regFileAndLinkCount,
      dirSizeStatsTimeSeriesNameGenerators.dirCount,
      dirSizeStatsTimeSeriesNameGenerators.totalSize,
      dirSizeStatsTimeSeriesNameGenerators.sizeOnStorage,
    ];

    const neededMetrics = neededTimeSeriesNameGenerators
      .reduce((acc, tsNameGenerator) => {
        const timeSeriesSchema = collectionSchema
          ?.timeSeriesSchemas
          ?.findBy('nameGenerator', tsNameGenerator);
        acc[tsNameGenerator] =
          getTimeSeriesMetricNamesWithAggregator(timeSeriesSchema, 'last')[0];
        return acc;
      }, {});

    const perProviderStatsPromises = {};

    providerIds.forEach((providerId) => {
      const statsPromise = (async () => {
        if (perProviderCollectionLayout[providerId].state === 'rejected') {
          throw perProviderCollectionLayout[providerId].reason;
        }
        const collectionLayout = perProviderCollectionLayout[providerId].value;
        const staticTimeSeries = neededTimeSeriesNameGenerators.slice(0, 3);
        const perStorageTimeSeriesCandidates = Object.keys(collectionLayout)
          .filter((tsName) =>
            tsName.startsWith(dirSizeStatsTimeSeriesNameGenerators.sizeOnStorage)
          );
        const perStorageTimeSeries = (await allFulfilled(
          perStorageTimeSeriesCandidates.map((tsName) => {
            const storageId = getStorageIdFromSizeOnStorageTSName(tsName);
            return this.storageManager
              .getStorageById(storageId, { throughSpaceId: spaceId })
              .then(() => tsName, () => null);
          })
        )).filter(Boolean);

        const layout = {};
        staticTimeSeries.forEach((tsName) => layout[tsName] = [neededMetrics[tsName]]);
        perStorageTimeSeries.forEach((tsName) =>
          layout[tsName] = [
            neededMetrics[dirSizeStatsTimeSeriesNameGenerators.sizeOnStorage],
          ]
        );

        const queryParams = {
          layout,
          windowLimit: 1,
        };

        const result = await this.getDirSizeStatsTimeSeriesCollectionSlice(
          fileId,
          providerId,
          queryParams,
        );

        const staticStatsValues = staticTimeSeries.reduce((acc, tsName) => {
          acc[tsName] = result
            ?.[tsName]
            ?.[neededMetrics[tsName]]
            ?.[0]?.value ?? 0;
          return acc;
        }, {});

        let totalPhysicalSize = 0;
        const physicalSizePerStorage = {};
        perStorageTimeSeries.forEach((tsName) => {
          const storageId = getStorageIdFromSizeOnStorageTSName(tsName);
          const sizeOnStorage = result
            ?.[tsName]
            ?.[neededMetrics[dirSizeStatsTimeSeriesNameGenerators.sizeOnStorage]]
            ?.[0]?.value ?? 0;
          const normalizedSizeOnStorage = Number.isFinite(sizeOnStorage) ?
            sizeOnStorage : 0;
          totalPhysicalSize += normalizedSizeOnStorage;
          physicalSizePerStorage[storageId] = normalizedSizeOnStorage;
        });

        return {
          regFileAndLinkCount: staticStatsValues[
            dirSizeStatsTimeSeriesNameGenerators.regFileAndLinkCount
          ],
          dirCount: staticStatsValues[dirSizeStatsTimeSeriesNameGenerators.dirCount],
          logicalSize: staticStatsValues[dirSizeStatsTimeSeriesNameGenerators.totalSize],
          totalPhysicalSize,
          physicalSizePerStorage,
        };
      })();

      perProviderStatsPromises[providerId] = (async () => {
        try {
          return {
            type: 'result',
            ...(await statsPromise),
          };
        } catch (error) {
          return {
            type: 'error',
            error,
          };
        }
      })();
    });

    const result = await hashFulfilled(perProviderStatsPromises);
    const currentProviderId = this.providerManager.getCurrentProviderId();
    if (result[currentProviderId].type === 'error') {
      throw result[currentProviderId].error;
    } else {
      return result;
    }
  },

  /**
   * @param {string} spaceId
   * @returns {Promise<SpaceCurrentSizeStats | null>}
   */
  async getSpaceCurrentSizeStats(spaceId) {
    const space = await this.spaceManager.getSpace(spaceId);
    const rootDirId = space.relationEntityId('rootDir');
    const archivesDirId = get(space, 'archivesDirId');
    const trashDirId = get(space, 'trashDirId');

    const resultStats = await hashFulfilled({
      [SpaceSizeStatsType.All]: this.getDirCurrentSizeStats(rootDirId),
      [SpaceSizeStatsType.Archives]: this.getDirCurrentSizeStats(archivesDirId),
      [SpaceSizeStatsType.Trash]: this.getDirCurrentSizeStats(trashDirId),
    });
    const availableStatTypes = Object.keys(resultStats);
    resultStats[SpaceSizeStatsType.RegularData] =
      Object.keys(resultStats[SpaceSizeStatsType.All])
      .reduce((regularData, providerId) => {
        // If for some type of stats in some provider is not present, then something
        // bad happened (race with (un)support?). It's safe to just omit him.
        if (availableStatTypes.find((type) => !resultStats[type][providerId])) {
          console.warn(
            `Could not load all stats for space ${spaceId} and provider ${providerId} due to unknown issue.`
          );
          return regularData;
        }

        // If for some type of stats some provider returned error, then regularData
        // stat for that provider should also represent an error.
        const providerErrors = availableStatTypes
          .filter((type) => resultStats[type][providerId].type === 'error')
          .map((type) => resultStats[type][providerId].error);
        if (providerErrors.length) {
          regularData[providerId] = {
            type: 'error',
            error: providerErrors.find(Boolean) ?? providerErrors[0],
          };
          return regularData;
        }

        regularData[providerId] = {
          type: 'result',
        };

        ['regFileAndLinkCount', 'dirCount', 'logicalSize', 'totalPhysicalSize']
        .forEach((valueType) => {
          regularData[providerId][valueType] = Math.max(
            resultStats[SpaceSizeStatsType.All][providerId][valueType] -
            resultStats[SpaceSizeStatsType.Archives][providerId][valueType] -
            resultStats[SpaceSizeStatsType.Trash][providerId][valueType],
            0
          );
        });
        regularData[providerId].physicalSizePerStorage =
          Object.keys(
            resultStats[SpaceSizeStatsType.All][providerId].physicalSizePerStorage
          )
          .reduce((physicalSizePerStorage, storageId) => {
            physicalSizePerStorage[storageId] =
              resultStats[SpaceSizeStatsType.All][providerId]
              .physicalSizePerStorage[storageId];
            if (
              resultStats[SpaceSizeStatsType.Archives][providerId]
              .physicalSizePerStorage[storageId]
            ) {
              physicalSizePerStorage[storageId] -=
                resultStats[SpaceSizeStatsType.Archives][providerId]
                .physicalSizePerStorage[storageId];
            }
            if (resultStats[SpaceSizeStatsType.Trash][providerId]
              .physicalSizePerStorage[storageId]
            ) {
              physicalSizePerStorage[storageId] -=
                resultStats[SpaceSizeStatsType.Trash][providerId]
                .physicalSizePerStorage[storageId];
            }
            return physicalSizePerStorage;
          }, {});

        return regularData;
      }, {});

    return resultStats;
  },

  /**
   * Begins a procedure of cancelling archive recall process that has root in
   * file with `recallRootId` entity ID.
   * @param {string} recallRootId
   * @returns {Promise<Object|null>} stop recall response or null if file is not a part
   *   of recalled tree
   */
  async cancelRecall(recallRootId) {
    const requestGri = gri({
      entityType: fileEntityType,
      entityId: recallRootId,
      aspect: cancelRecallAspect,
    });
    return this.get('onedataGraph').request({
      operation: 'create',
      gri: requestGri,
      subscribe: false,
    });
  },

  /**
   * Loads recall process logs for specific recall root.
   * @param {string} recallRootId
   * @param {AuditLogListingParams} listingParams
   * @returns {Promise<AuditLogEntriesPage<RecallAuditLogEntryContent>>}
   */
  async getRecallLogs(recallRootId, listingParams) {
    const requestGri = gri({
      entityType: fileEntityType,
      entityId: recallRootId,
      aspect: recallLogAspect,
    });
    return await this.get('auditLogManager').getAuditLogEntries(
      requestGri,
      listingParams,
      normalizeRecallAuditLogEntryContent
    );
  },

  async getFileOwner(file) {
    // Allowing file to not have relationEntityId beacuse some integration tests
    // are using not-fully-mocked files
    // TODO: VFS-9850 Use real file model in tests
    const ownerId = file.relationEntityId?.('owner');
    if (!ownerId) {
      return null;
    }
    return await this.userManager.getUserById(ownerId, {
      throughSpaceId: get(file, 'spaceEntityId'),
    });
  },

  /**
   * Should be invoked when file properties have changed and there are some associated
   * files (including dirs) that will be affected by that change, eg. changing QoS
   * requirements.
   * @param {Models.File} file
   * @return {Promise}
   */
  async refreshRelatedFiles(file) {
    if (!file) {
      return;
    }
    if (get(file, 'hardlinksCount') > 1) {
      this.fileParentRefresh(file);
    }
    if (get(file, 'type') === 'dir') {
      this.dirChildrenRefresh(get(file, 'entityId'));
    }
  },

  // TODO: VFS-7643 move browser non-file-model-specific methods to other service

  //#region browser component utils

  async pollForFileAfterOperation(
    attempts,
    interval,
    parentDirEntityId,
    name,
    targetSize,
    operation,
    operationPromiseObject,
  ) {
    const pollSizeInterval = 1000;

    if (operationPromiseObject.isRejected) {
      return;
    }

    if (attempts > 0) {
      const file = await this.getFileByName(parentDirEntityId, name);
      if (file) {
        this.throttledDirChildrenRefresh(parentDirEntityId);
        set(file, 'currentOperation', operation);
        file.pollSize(pollSizeInterval, targetSize);
      } else {
        later(
          this,
          'pollForFileAfterOperation',
          attempts - 1,
          interval,
          parentDirEntityId,
          name,
          targetSize,
          operation,
          operationPromiseObject,
          interval,
        );
      }
    }
  },

  /**
   * Invokes request for refresh in all known file browser tables
   * @param {Array<object>} parentDirEntityId
   * @returns {Array<object>}
   */
  dirChildrenRefresh(parentDirEntityId) {
    return allSettled(this.get('fileTableComponents').map(fbTable =>
      fbTable.onDirChildrenRefresh(parentDirEntityId)
    ));
  },

  throttledDirChildrenRefresh(parentDirEntityId) {
    const throttledDirChildrenRefreshCallbacks = this.get(
      'throttledDirChildrenRefreshCallbacks'
    );
    if (!throttledDirChildrenRefreshCallbacks[parentDirEntityId]) {
      throttledDirChildrenRefreshCallbacks[parentDirEntityId] = createThrottledFunction(
        () => this.dirChildrenRefresh(parentDirEntityId),
        500
      );
    }
    throttledDirChildrenRefreshCallbacks[parentDirEntityId]();
  },

  async fileParentRefresh(file) {
    const parentGri = file.belongsTo('parent').id();
    if (parentGri) {
      return this.dirChildrenRefresh(
        parseGri(parentGri).entityId
      );
    }
  },

  registerRefreshHandler(fileBrowserComponent) {
    this.get('fileTableComponents').push(fileBrowserComponent);
  },

  deregisterRefreshHandler(fileBrowserComponent) {
    _.pull(this.get('fileTableComponents'), fileBrowserComponent);
  },

  //#endregion browser component utils
});

/**
 * @param {string} fileId
 * @param {string} [providerId]
 * @returns {string}
 */
export function dirSizeStatsGri(fileId, providerId = undefined) {
  return gri({
    entityId: fileId,
    entityType: fileEntityType,
    aspect: 'dir_size_stats_collection',
    aspectId: providerId,
    scope: 'private',
  });
}

/**
 * @param {unknown} content should be a `RecallAuditLogEntryContent`-like object
 * @returns {RecallAuditLogEntryContent}
 */
function normalizeRecallAuditLogEntryContent(content) {
  const normalizedContent = content || {};

  if (typeof normalizedContent.fileId !== 'string') {
    normalizedContent.fileId = null;
  }
  if (typeof normalizedContent.relativePath !== 'string') {
    normalizedContent.relativePath = null;
  }

  return normalizedContent;
}

function getStorageIdFromSizeOnStorageTSName(tsName) {
  return tsName.slice(dirSizeStatsTimeSeriesNameGenerators.sizeOnStorage.length);
}
