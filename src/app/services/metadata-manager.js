/**
 * Backend operations on file metadata
 *
 * @module services/metadata-manager
 * @author Jakub Liput
 * @copyright (C) 2020-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { get } from '@ember/object';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { entityType as fileEntityType } from 'oneprovider-gui/models/file';
import _ from 'lodash';

const BackendMetadataType = Object.freeze({
  xattrs: 'xattrs',
  json: 'json_metadata',
  rdf: 'rdf_metadata',
});

function metadataGri(fileId, metadataType, scope = 'private') {
  const aspect = BackendMetadataType[metadataType];
  return gri({
    entityType: fileEntityType,
    entityId: fileId,
    aspect,
    scope,
  });
}

const serializers = {
  xattrs: _.identity,
  /**
   * @param {String|Object} data
   * @returns {Object}
   */
  json(data) {
    if (typeof data === 'string') {
      return JSON.parse(data);
    } else {
      return data;
    }
  },
  rdf: _.identity,
};

const deserializers = {
  xattrs: _.identity,
  /**
   * @param {String} data
   * @returns {Object}
   */
  json(data) {
    return JSON.stringify(data, null, 2);
  },
  rdf: _.identity,
};

export default Service.extend({
  onedataGraph: service(),

  /**
   * @param {Models.File} file
   * @param {String} metadataType one of: xattrs, json, rdf
   * @param {String} scope one of: private, public
   * @returns {Promise<Object>} with `metadata` key
   */
  async getMetadata(file, metadataType, scope) {
    const data = await this.onedataGraph.request({
      operation: 'get',
      gri: metadataGri(get(file, 'entityId'), metadataType, scope),
      subscribe: false,
    });
    return deserializers[metadataType](data.metadata);
  },

  /**
   * @param {Models.File} file
   * @param {String} metadataType one of: xattrs, json, rdf
   * @param {any} metadata Object for xattrs, String for RDF and JSON
   * @returns {Promise<Object>} with `metadata` key
   */
  async setMetadata(file, metadataType, metadata) {
    const serializedMetadata = serializers[metadataType](metadata);
    return this.onedataGraph.request({
      operation: 'create',
      gri: metadataGri(get(file, 'entityId'), metadataType),
      data: {
        metadata: serializedMetadata,
      },
      subscribe: false,
    });
  },

  /**
   * @param {Models.File} file
   * @param {Array<String>} keys keys that will be removed from xattrs
   * @returns {Promise}
   */
  async removeXattrs(file, keys) {
    return this.onedataGraph.request({
      operation: 'delete',
      gri: metadataGri(get(file, 'entityId'), 'xattrs'),
      data: { keys },
      subscribe: false,
    });
  },

  /**
   * @param {Models.File} file
   * @param {String} metadataType
   * @returns {Promise}
   */
  async removeMetadata(file, metadataType) {
    return this.onedataGraph.request({
      operation: 'delete',
      gri: metadataGri(get(file, 'entityId'), metadataType),
      subscribe: false,
    });
  },
});
