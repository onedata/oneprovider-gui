/**
 * Provides model functions related to archives.
 *
 * @module services/archive-manager
 * @author Jakub Liput
 * @copyright (C) 2021-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service from '@ember/service';
import { get } from '@ember/object';
import { inject as service } from '@ember/service';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { entityType as datasetEntityType } from 'oneprovider-gui/models/dataset';
import { entityType as archiveEntityType } from 'oneprovider-gui/models/archive';
import { all as allFulfilled } from 'rsvp';
import BrowsableArchive from 'oneprovider-gui/utils/browsable-archive';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';

const datasetArchivesAspect = 'archives_details';

/**
 * @typedef {Object} ArchiveLogErrorReason
 */

/**
 * There are 3 types of log events:
 * - archivisation finished
 * - archivisation failed
 * - archived file verification failed
 *
 * @typedef {Object} ArchiveAuditLogEntryContent
 * @property {string|null} fileId CDMI Object ID of the file that the event is about.
 *   For archivisation finish/fail it's a file from dataset.
 *   For verification fail it's a file created in archive.
 * @property {string|null} description A human-readable description of event.
 * @property {string} path Absolute path to file specified with `fileId`.
 *   All paths start with `/`.
 *   - If event is archivisation finish/failure then it is path starting with space root
 *     dir.
 *   - If event is file verification failure then it is path starting with archive root
 *     dir.
 * @property {number} [startTimestamp] Milliseconds timestamp when the archivisation
 *   process started of file for which the event is about. Only for archivisation
 *   finish/fail events.
 * @property {ArchiveLogErrorReason} [reason] Error object - only for archivisation failed
 *   event.
 * @property {FileType} fileType Type of file specified with `fileId`.
 */

/**
 * Info about pair of source and file created in archive for the source file.
 * @typedef {Object} ArchiveFileInfo
 * @property {string} archivedFileId GUID of file created in archive.
 * @property {string} sourceFileId GUID of source file from space that was used to create
 *   file in an archive.
 */

const auditLogAspect = 'audit_log';

export default Service.extend({
  onedataGraph: service(),
  store: service(),
  fileManager: service(),
  auditLogManager: service(),

  /**
   * Mapping of `archiveId` -> PromiseProxy of cached browsable-wrapped archive
   * @type {Object}
   */
  browsableArchivesStore: undefined,

  init() {
    this._super(...arguments);
    this.set('browsableArchivesStore', {});
  },

  /**
   * @param {String} archiveId entityId of archive
   * @param {Object} requestOptions `store.findRecord` options
   * @returns {Promise<Models.Archive>}
   */
  async getArchive(archiveId, requestOptions) {
    const requestGri = gri({
      entityType: archiveEntityType,
      entityId: archiveId,
      aspect: 'instance',
      scope: 'private',
    });
    return this.get('store').findRecord('archive', requestGri, requestOptions);
  },

  /**
   * Creates or returns previously created BrowsableArchive object.
   * Only one `BrowsableArchive` for specific `archiveId` is created.
   * @param {String|Models.Archive} archiveOrEntityId
   * @returns {Promise<Utils.BrowsableArchive>}
   */
  async getBrowsableArchive(archiveOrEntityId) {
    let archiveId;
    let archive;
    if (typeof (archiveOrEntityId) === 'string') {
      archiveId = archiveOrEntityId;
    } else {
      archiveId = get(archiveOrEntityId, 'entityId');
      archive = archiveOrEntityId;
    }
    const browsableArchivesStore = this.get('browsableArchivesStore');
    const cachedBrowsableArchiveProxy = browsableArchivesStore[archiveId];
    if (cachedBrowsableArchiveProxy) {
      return await cachedBrowsableArchiveProxy;
    } else {
      const browsableDatasetPromise = (async () => BrowsableArchive.create({
        content: archive || await this.getArchive(archiveId),
      }))();
      const browsableArchiveProxy = promiseObject(browsableDatasetPromise);
      browsableArchivesStore[archiveId] = browsableArchiveProxy;
      return await browsableArchiveProxy;
    }
  },

  /**
   * @param {Models.Dataset} dataset
   * @param {{
   *  config: Object,
   *  description: String,
   *  preservedCallback: String,
   *  deletedCallback: String
   * }} data
   * @returns {Promise<Models.Archive>}
   */
  async createArchive(dataset, data) {
    const {
      store,
      fileManager,
    } = this.getProperties('store', 'fileManager');
    const archive = store.createRecord('archive', Object.assign({
      _meta: {
        additionalData: {
          datasetId: get(dataset, 'entityId'),
        },
      },
    }, data));
    try {
      await archive.save();
    } finally {
      try {
        const datasetId = dataset && get(dataset, 'entityId');
        await allFulfilled([
          dataset.reload(),
          fileManager.dirChildrenRefresh(datasetId),
        ]);
      } catch (error) {
        console.error(
          'services:archive-manager#createArchive: error updating dataset',
          error
        );
      }
    }
    return archive;
  },

  /**
   * @param {Models.Archive} archive
   * @param {{
   *   description: String,
   *   preservedCallback: String,
   *   deletedCallback: String,
   * }} data
   * @returns {Promise<Models.Archive>}
   */
  async modifyArchive(archive, data) {
    archive.setProperties(data);
    await archive.save();
    try {
      await archive.belongsTo('dataset').reload();
    } catch (error) {
      console.error(
        'services:archive-manager#modifyArchive: error updating archive',
        error
      );
    }
    return archive;
  },

  /**
   * @param {Models.Archive} archive
   * @returns {Promise}
   */
  async deleteArchive(archive) {
    const onedataGraph = this.get('onedataGraph');
    const parentDatasetRelation = archive.belongsTo('dataset');
    const deleteResponse = await onedataGraph.request({
      operation: 'create',
      gri: gri({
        entityType: archiveEntityType,
        entityId: get(archive, 'entityId'),
        aspect: 'delete',
        scope: 'private',
      }),
      subscribe: false,
    });
    // only a side effect
    parentDatasetRelation.reload().catch(error => {
      console.error(
        `service:archive-manager#deleteArchive: failed to update dataset ${parentDatasetRelation && parentDatasetRelation.id()}: ${error}`
      );
    });

    try {
      await archive.reload();
    } catch (error) {
      if (!error || error && error.id !== 'notFound') {
        console.error(
          'services:archive-manager#deleteArchive: error updating archive',
          error
        );
      }
    }
    return deleteResponse;
  },

  /**
   * @param {Models.Archive} archive
   * @returns {Promise}
   */
  async cancelArchivization(archive) {
    const onedataGraph = this.get('onedataGraph');
    const deleteResponse = await onedataGraph.request({
      operation: 'create',
      gri: gri({
        entityType: archiveEntityType,
        entityId: get(archive, 'entityId'),
        aspect: 'cancel',
        scope: 'private',
      }),
      subscribe: false,
    });

    try {
      await archive.reload();
    } catch (error) {
      if (!error || error && error.id !== 'notFound') {
        console.error(
          'services:archive-manager#cancelArchivization: error updating archive',
          error
        );
      }
    }
    return deleteResponse;
  },

  /**
   * @typedef {Object} RecallArchiveResponse
   * @param {String} rootFileId entity ID of newly created recalled root file
   *   or directory
   */

  /**
   * @param {Models.Archive} archive
   * @param {Models.File} targetDir directory where target directory with archive files
   *   should be created
   * @param {String} name name of created directory or file in filesystem that will
   *   contain recalled data
   * @returns {Promise<RecallArchiveResponse>}
   */
  async recallArchive(archive, targetDir, name) {
    const {
      onedataGraph,
      fileManager,
    } = this.getProperties('onedataGraph', 'fileManager');
    const result = await onedataGraph.request({
      operation: 'create',
      gri: gri({
        entityType: archiveEntityType,
        entityId: get(archive, 'entityId'),
        aspect: 'recall',
        scope: 'private',
      }),
      data: {
        parentDirectoryId: get(targetDir, 'cdmiObjectId'),
        targetFileName: name,
      },
      subscribe: false,
    });
    try {
      fileManager.dirChildrenRefresh(get(targetDir, 'entityId'));
    } catch (error) {
      console.warn(
        'service:archive-manager#recallArchive: refreshing dirs view failed',
        error
      );
    }
    return result;
  },

  /**
   * @param {String} datasetId entityId of dataset to list its archive children
   * @param {String} index
   * @param {Number} limit
   * @param {Number} offset
   * @returns {Promise<{ childrenRecords: Array<Models.Archive>, isLast: Boolean }>}
   */
  async fetchDatasetArchives({
    datasetId,
    scope = 'private',
    index,
    limit,
    offset,
  }) {
    if (!datasetId || !limit || limit <= 0) {
      return { childrenRecords: [], isLast: true };
    } else {
      return this.fetchDatasetArchivesAttrs({
        datasetId,
        scope,
        index,
        limit,
        offset,
      }).then(async ({ archives, isLast }) => {
        const childrenRecords = await this.pushAttrsToStore(
          archives,
          scope,
        );
        return { childrenRecords, isLast };
      });
    }
  },

  /**
   * @param {string} archiveId
   * @param {AuditLogListingParams} listingParams
   * @returns {Promise<AuditLogEntriesPage<ArchiveAuditLogEntryContent>>}
   */
  async getAuditLog(archiveId, listingParams) {
    const requestGri = gri({
      entityType: archiveEntityType,
      entityId: archiveId,
      aspect: auditLogAspect,
    });
    return await this.auditLogManager.getAuditLogEntries(
      requestGri,
      listingParams,
      normalizeQosAuditLogEntryContent
    );
  },

  /**
   * Resolves information about file under file path in archive.
   * @param {string} archiveId
   * @param {string} relativePath A path to file excluding space dir or archive dir.
   *   The path is without `/` prefix, eg. if absolute path is
   *   `/space_name/hello/world.txt` then relative path is `hello/world.txt`.
   * @returns {ArchiveFileInfo}
   */
  async getFileInfo(archiveId, relativePath) {
    const fileInfoGri = gri({
      entityType: archiveEntityType,
      entityId: archiveId,
      // FIXME: API changes
      // aspect: 'identify_file',
      aspect: 'file_info',
    });
    return this.onedataGraph.request({
      gri: fileInfoGri,
      // FIXME: API changes
      // operation: 'create',
      operation: 'get',
      data: {
        relativePath,
      },
      subscribe: false,
    });
  },

  /**
   * @param {Array<Object>} attrs data for creating Archive model
   * @param {String} [scope='private'] currently only private is supported
   * @returns {Promise<Array<Model>>}
   */
  async pushAttrsToStore(attrs, scope = 'private') {
    const store = this.get('store');
    return attrs.map(attrsData => {
      attrsData.scope = scope;
      const modelData = store.normalize('archive', attrsData);
      return store.push(modelData);
    });
  },

  /**
   * @param {String} datasetId entityId of dataset to list its children archives
   * @param {String} [scope='private'] currently only private is supported
   * @param {String} index
   * @param {Number} limit
   * @param {Number} offset
   * @returns {Promise<{ datasets: Array, isLast: Boolean }>}
   */
  async fetchDatasetArchivesAttrs({
    datasetId,
    scope = 'private',
    index,
    limit,
    offset,
  }) {
    const requestGri = gri({
      entityId: datasetId,
      entityType: datasetEntityType,
      aspect: datasetArchivesAspect,
      scope,
    });
    return this.get('onedataGraph').request({
      operation: 'get',
      gri: requestGri,
      data: {
        index,
        limit,
        offset,
      },
      subscribe: false,
    });
  },
});

/**
 * @param {unknown} content should be a `ArchiveAuditLogEntryContent`-like object
 * @returns {ArchiveAuditLogEntryContent}
 */
function normalizeQosAuditLogEntryContent(content) {
  const normalizedContent = content || {};

  if (typeof normalizedContent.fileId !== 'string') {
    normalizedContent.fileId = null;
  }
  if (typeof normalizedContent.description !== 'string') {
    normalizedContent.description = null;
  }

  return normalizedContent;
}
