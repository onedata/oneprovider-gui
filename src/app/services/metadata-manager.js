/**
 * Backend operations on file metadata
 * 
 * @module services/metadata-manager
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { get } from '@ember/object';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { entityType as fileEntityType } from 'oneprovider-gui/models/file';

const BackendMetadataType = Object.freeze({
  xattrs: 'xattrs',
  json: 'json_metadata',
  rdf: 'rdf_metadata',
});

function metadataGri(fileId, metadataType) {
  const aspect = BackendMetadataType[metadataType];
  return gri({
    entityType: fileEntityType,
    entityId: fileId,
    aspect,
  });
}

export default Service.extend({
  onedataGraph: service(),

  /**
   * @param {Models.File} file 
   * @param {String} metadataType one of: xattrs, json, rdf
   * @returns {Promise<Object>} with `metadata` key
   */
  getMetadata(file, metadataType) {
    return this.get('onedataGraph').request({
      operation: 'get',
      gri: metadataGri(get(file, 'entityId'), metadataType),
      subscribe: false,
    });
  },

  /**
   * @param {Models.File} file 
   * @param {String} metadataType one of: xattrs, json, rdf
   * @param {any} metadata Object for xattrs and JSON, String for RDF
   * @returns {Promise<Object>} with `metadata` key
   */
  setMetadata(file, metadataType, metadata) {
    return this.get('onedataGraph').request({
      operation: 'create',
      gri: metadataGri(get(file, 'entityId'), metadataType),
      data: {
        metadata,
      },
      subscribe: false,
    });
  },

  /**
   * @param {Models.File} file 
   * @param {Array<String>} keys keys that will be removed from xattrs
   * @returns {Promise}
   */
  removeXattrs(file, keys) {
    return this.get('onedataGraph').request({
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
  removeMetadata(file, metadataType) {
    return this.get('onedataGraph').request({
      operation: 'delete',
      gri: metadataGri(get(file, 'entityId'), metadataType),
      subscribe: false,
    });
  },
});
