import Service, { inject as service } from '@ember/service';
import { get } from '@ember/object';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { entityType as fileEntityType } from 'oneprovider-gui/models/file';

export const BackendMetadataType = Object.freeze({
  xattrs: 'xattrs',
  json: 'json_metadata',
  rdf: 'rdf_metadata',
});

export function metadataGri(fileId, aspect) {
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
    const {
      onedataGraph,
    } = this.getProperties('onedataGraph');
    return onedataGraph.request({
      operation: 'get',
      gri: metadataGri(get(file, 'entityId'), BackendMetadataType[metadataType]),
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
    const {
      onedataGraph,
    } = this.getProperties('onedataGraph');
    return onedataGraph.request({
      operation: 'create',
      gri: metadataGri(get(file, 'entityId'), BackendMetadataType[metadataType]),
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
    const {
      onedataGraph,
    } = this.getProperties('onedataGraph');
    return onedataGraph.request({
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
    const {
      onedataGraph,
    } = this.getProperties('onedataGraph');
    return onedataGraph.request({
      operation: 'delete',
      gri: metadataGri(get(file, 'entityId'), BackendMetadataType[metadataType]),
      subscribe: false,
    });
  },
});
