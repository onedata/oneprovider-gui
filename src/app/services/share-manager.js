/**
 * Backend operations for shares
 * 
 * @module services/share-manager
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { get, set } from '@ember/object';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { entityType as shareEntityType } from 'oneprovider-gui/models/share';

export default Service.extend({
  store: service(),
  onedataGraph: service(),

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
            // FIXME: use rootFileId
            fileId: get(file, 'cdmiObjectId'),
          },
        },
      })
      .save();
  },

  removeShare(share) {
    return share.destroyRecord();
  },

  renameShare(share, name) {
    const currentName = get(share, 'name');
    set(share, 'name', name);
    return share.save()
      .catch((error) => {
        set(share, 'name', currentName);
        throw error;
      });
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
});
