import OnedataWebsocketAdapter from 'onedata-gui-websocket-client/adapters/onedata-websocket';
import FileQuery from 'oneprovider-gui/utils/file-query';
import { inject as service } from '@ember/service';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import _ from 'lodash';

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
        if (!snapshot.adapterOptions) {
          snapshot.adapterOptions = {};
        }
        if (!snapshot.adapterOptions._meta) {
          snapshot.adapterOptions._meta = {};
        }
        if (!snapshot.adapterOptions._meta.additionalData) {
          snapshot.adapterOptions._meta.additionalData = {};
        }
        // FIXME: do not get attributes for buggy root dir
        const fakeRoot =
          'Z3VpZCN1c2VyUm9vdF9kYjg3MjFmMGFiM2E5YjFjZjU4ZGUwMWYwNGVlMzlhNGNoZDlhZCNyb290RGlyVmlydHVhbFNwYWNlSWQ';
        if (!id.includes(fakeRoot)) {
          snapshot.adapterOptions._meta.additionalData.attributes = attributes;
        } else {
          snapshot.adapterOptions._meta.additionalData.attributes = [
            'fileId',
            'name',
            'type',
            'activePermissionsType',
            // 'archiveId',
            'atime',
            'conflictingFiles',
            'conflictingName',
            'ctime',
            // 'effDatasetMembership',
            // 'effDatasetProtectionFlags',
            // 'effProtectionFlags',
            // 'effQosMembership',
            'hardlinksCount',
            'hasMetadata',
            'index',
            'isDeleted',
            'isFullyReplicated',
            'localReplicationRate',
            'mtime',
            'ownerId',
            'parentId',
            'posixPermissions',
            'providerId',
            // 'qosStatus',
            'shares',
            'size',
            // 'storageGroupId',
            // 'storageUserId',
            'symlinkValue',
          ];
        }
      }
    }
    return await this._super(...arguments);
  },
});
