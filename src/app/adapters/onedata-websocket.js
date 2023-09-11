// FIXME: jsdoc

import OnedataWebsocketAdapter from 'onedata-gui-websocket-client/adapters/onedata-websocket';
import FileQuery from 'oneprovider-gui/utils/file-query';
import { inject as service } from '@ember/service';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import _ from 'lodash';
import { pullPrivateFileAttributes } from 'oneprovider-gui/utils/file-model';

export default OnedataWebsocketAdapter.extend({
  fileRequirementRegistry: service(),

  /**
   * @override
   */
  async findRecord(store, type, id, snapshot) {
    /** @type {Object|undefined} */
    const meta = snapshot.adapterOptions?._meta;
    const currentAdditionalData = meta?.additionalData;
    if (type.modelName === 'file' && !currentAdditionalData?.attributes) {
      const queries = [FileQuery.create({
        fileGri: id,
      })];
      const parentGri = snapshot?.belongsTo?.('parent')?.id;
      if (parentGri) {
        const parentId = parseGri(parentGri).entityId;
        queries.push(FileQuery.create({
          parentId,
        }));
      }
      const attributes =
        this.fileRequirementRegistry.findAttrsRequirement(...queries);
      if (!_.isEmpty(attributes)) {
        try {
          const scope = parseGri(id)?.scope;
          if (scope === 'public') {
            pullPrivateFileAttributes(attributes);
          }
        } catch {
          // If the id is non-parseable, do not bother pulling attributes, as the request
          // will probably fail.
          console.warn('findRecord: file ID is not parseable as GRI', id);
        }
        if (!snapshot.adapterOptions) {
          snapshot.adapterOptions = {};
        }
        if (!snapshot.adapterOptions._meta) {
          snapshot.adapterOptions._meta = {};
        }
        if (!snapshot.adapterOptions._meta.additionalData) {
          snapshot.adapterOptions._meta.additionalData = {};
        }
        snapshot.adapterOptions._meta.additionalData.attributes = attributes;
      }
    }
    return await this._super(...arguments);
  },
});
