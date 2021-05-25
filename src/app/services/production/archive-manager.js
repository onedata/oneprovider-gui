/**
 * Provides model functions related to archives.
 *
 * @module services/archive-manager
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service from '@ember/service';
import { get } from '@ember/object';
import { inject as service } from '@ember/service';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { entityType as datasetEntityType } from 'oneprovider-gui/models/dataset';
import { entityType as archiveEntityType } from 'oneprovider-gui/models/archive';
import { all as allFulfilled } from 'rsvp';

const datasetArchivesAspect = 'archives_details';

export default Service.extend({
  onedataGraph: service(),
  store: service(),
  fileManager: service(),

  /**
   * @param {String} archiveId entityId of archive
   * @param {String} scope currently only 'private' is supported
   * @returns {Promise<Models.Archive>}
   */
  async getArchive(archiveId, scope = 'private') {
    const requestGri = gri({
      entityType: archiveEntityType,
      entityId: archiveId,
      aspect: 'instance',
      scope,
    });
    return this.get('store').findRecord('archive', requestGri);
  },

  /**
   * @param {Models.Dataset} dataset
   * @param {{
   *  config: Object,
   *  description: String,
   *  preservedCallback: String,
   *  purgedCallback: String
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
    await archive.save();
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
    return archive;
  },

  /**
   * @param {Models.Archive} archive 
   * @param {{
   *   description: String,
   *   preservedCallback: String,
   *   purgedCallback: String,
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
  async purgeArchive(archive) {
    const onedataGraph = this.get('onedataGraph');
    const purgeResponse = await onedataGraph.request({
      operation: 'create',
      gri: gri({
        entityType: archiveEntityType,
        entityId: get(archive, 'entityId'),
        aspect: 'purge',
        scope: 'private',
      }),
      subscribe: false,
    });
    try {
      await archive.reload();
    } catch (error) {
      console.dir(error);
      if (!error || error && error.id !== 'notFound') {
        console.error(
          'services:archive-manager#purgeArchive: error updating archive',
          error
        );
      }
    }
    return purgeResponse;
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
    if (!limit || limit <= 0) {
      return { childrenRecords: [], isLast: false };
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
