/**
 * Describes context of view that is needed to display a `file` .
 *
 * Eg. a file can be a part of archive in some dataset - then the context tells that
 * the browser view should be configured for the particular dataset and archive in
 * a particular space.
 *
 * This file contains the Ember class that is the comparable (see `isEqual`) describing
 * the context and a factory (in named export) for producing context objects.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed, get } from '@ember/object';
import { inject as service } from '@ember/service';
import FileArchiveInfo from 'oneprovider-gui/utils/file-archive-info';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { getSpaceIdFromGuid, getShareIdFromGuid } from 'onedata-gui-common/utils/file-guid-parsers';

const FilesViewContext = EmberObject.extend({
  file: undefined,

  spaceId: null,
  shareId: null,
  archiveId: null,
  datasetId: null,

  /**
   * If true, the file is a special hidden directory that should not be viewed in any
   * files browser EXCEPT share root dir that can be viewed as archive root in
   * archive files browser.
   * @virtual
   * @type {Boolean}
   */
  isSpecialHiddenDir: false,

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
    const file = await this.get('fileManager').getFileById(fileId, { scope });
    return this.createFromFile(file);
  },

  async createFromFile(file) {
    const fileArchiveInfo = FileArchiveInfo.create({
      ownerSource: this,
      file,
    });
    const fileId = get(file, 'entityId');
    const shareId = file && getShareIdFromGuid(fileId) || null;
    return FilesViewContext.create({
      ownerSource: this,
      spaceId: getSpaceIdFromGuid(fileId),
      shareId,
      isSpecialHiddenDir: await get(fileArchiveInfo, 'isSpecialHiddenDirProxy'),
      archiveId: await get(fileArchiveInfo, 'archiveIdProxy'),
      datasetId: await get(fileArchiveInfo, 'datasetIdProxy'),
      file,
    });
  },
});

export default FilesViewContext;
