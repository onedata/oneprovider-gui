import EmberObject, { computed, get } from '@ember/object';
import { inject as service } from '@ember/service';
import FileArchiveInfo from 'oneprovider-gui/utils/file-archive-info';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { getSpaceIdFromFileId, getShareIdFromFileId } from 'oneprovider-gui/models/file';

const FilesViewContext = EmberObject.extend({
  file: undefined,

  spaceId: null,
  shareId: null,
  archiveId: null,
  datasetId: null,

  browserType: computed('shareId', 'archiveId', 'datasetId', function browserType() {
    const {
      shareId,
      archiveId,
      datasetId,
    } = this.getProperties('shareId', 'archiveId', 'datasetId');
    if (shareId) {
      return 'share';
    } else if (datasetId && archiveId) {
      return 'archive';
    } else {
      return 'space';
    }
  }),

  isEqual(otherContext) {
    if (!otherContext) {
      return false;
    }
    return [
      'browserType',
      'spaceId',
      'shareId',
      'datasetId',
      'archiveId',
    ].every((property) => {
      return this.get(property) === get(otherContext, property);
    });
  },
});

export const FilesViewContextFactory = EmberObject.extend(OwnerInjector, {
  fileManager: service(),

  async createFromFileId(fileId, scope = 'private') {
    const file = await this.get('fileManager').getFileById(fileId, scope);
    return this.createFromFile(file);
  },

  async createFromFile(file) {
    const fileArchiveInfo = FileArchiveInfo.create({
      ownerSource: this,
      file,
    });
    const fileId = get(file, 'entityId');
    const shareId = file && getShareIdFromFileId(fileId) || null;
    return FilesViewContext.create({
      ownerSource: this,
      spaceId: getSpaceIdFromFileId(fileId),
      shareId,
      archiveId: await get(fileArchiveInfo, 'archiveIdProxy'),
      datasetId: await get(fileArchiveInfo, 'datasetIdProxy'),
      file,
    });
  },
});

export default FilesViewContext;
