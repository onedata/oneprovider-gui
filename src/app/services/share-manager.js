/**
 * Backend operations for shares
 *
 * @author Jakub Liput
 * @copyright (C) 2020-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { computed, get, set } from '@ember/object';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { entityType as shareEntityType } from 'oneprovider-gui/models/share';
import {
  getFileGri,
} from 'oneprovider-gui/models/file';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';

export default Service.extend({
  store: service(),
  onedataGraph: service(),
  appProxy: service(),
  fileManager: service(),

  /**
   * @param {Models.File} file
   * @param {String} name
   * @returns {Models.Share} share
   */
  createShare(file, name) {
    const shareName = name ? name : get(file, 'name');

    return this.get('store').createRecord('share', {
        name: shareName,
        _meta: {
          additionalData: {
            rootFileId: get(file, 'cdmiObjectId'),
          },
        },
      })
      .save();
  },

  async removeShare(shareRecordOrId) {
    const share = typeof shareRecordOrId === 'string' ?
      (await this.getShare(shareRecordOrId)) : shareRecordOrId;
    try {
      return await share.destroyRecord();
    } catch (error) {
      try {
        share.rollbackAttributes();
        await share.reload();
      } catch {
        // ignore reload errors
      }
      throw error;
    }
  },

  async renameShare(shareRecordOrId, name) {
    const share = typeof shareRecordOrId === 'string' ?
      (await this.getShare(shareRecordOrId)) : shareRecordOrId;
    const currentName = share.name;
    set(share, 'name', name);
    try {
      return await share.save();
    } catch (error) {
      set(share, 'name', currentName);
      throw error;
    }
  },

  getShare(shareId, scope = 'private') {
    const requestGri = gri({
      entityType: shareEntityType,
      entityId: shareId,
      aspect: 'instance',
      scope,
    });
    return this.get('store').findRecord('share', requestGri);
  },

  /**
   *
   * @param {InfiniteListQuery} listQuery
   * @returns {ShareDataListPage}
   */
  async getOnezoneSpaceShareList(spaceId, listQuery) {
    const {
      array,
      isLast,
    } = await this.appProxy.callParent('getSpaceShareList', spaceId, listQuery);
    const fileManager = this.fileManager;
    return {
      array: array.map(shareData => new OneproviderShareListItem({
        shareData,
        fileManager,
      })),
      isLast,
    };
  },
});

export class OneproviderShareListItem {
  /**
   * @virtual
   * @type {ShareListItem}
   */
  shareData = undefined;

  fileManager = undefined;

  constructor({ shareData, fileManager }) {
    this.shareData = shareData;
    this.fileManager = fileManager;
  }

  //#region proxied properties

  get index() {
    return this.shareData.index;
  }

  get id() {
    return this.shareData.shareId;
  }

  get entityId() {
    return this.shareData.shareId;
  }

  get name() {
    return this.shareData.name;
  }

  /** @type {FileType} */
  get rootFileType() {
    return this.shareData.rootFileType;
  }

  get rootFilePrivateId() {
    return this.shareData.rootFilePrivateId;
  }

  get rootFilePublicId() {
    return this.shareData.rootFilePublicId;
  }

  get handleId() {
    return this.shareData.handleId;
  }

  get handlePublicUrl() {
    return this.shareData.handlePublicUrl;
  }

  get sharePublicUrl() {
    return this.shareData.sharePublicUrl;
  }

  //#endregion

  get rootFilePublicGri() {
    return getFileGri(this.rootFilePublicId, 'public');
  }

  get rootFilePrivateGri() {
    return getFileGri(this.rootFilePrivateId, 'private');
  }

  get hasHandle() {
    return Boolean(this.handleId);
  }

  @computed
  get rootFilePublicProxy() {
    return promiseObject(this.getRootFilePublic());
  }

  @computed
  get rootFilePrivateProxy() {
    return promiseObject(this.getRootFilePrivate());
  }

  async getRootFilePublic() {
    return await this.fileManager.getFileById(this.rootFilePublicId, { scope: 'public' });
  }

  async getRootFilePrivate() {
    return await this.fileManager.getFileById(this.rootFilePrivateId);
  }
}
