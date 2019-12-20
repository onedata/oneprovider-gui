import Service, { inject as service } from '@ember/service';
import { get, getProperties } from '@ember/object';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { entityType as shareEntityType } from 'oneprovider-gui/models/share';

export default Service.extend({
  store: service(),
  onedataGraph: service(),

  /**
   * @param {Models.File} file
   * @returns {String} GRI of share instance for specific file
   */
  shareGriForFile(file) {
    const {
      entityId,
    } = getProperties(file, 'entityId');
    return gri({
      entityType: shareEntityType,
      entityId,
      aspect: 'shared_dir',
    });
  },

  /**
   * @param {Models.File} file 
   * @param {String} name 
   * @returns {Object} data
   * @returns {String} data.shareId
   */
  createShare(file, name) {
    const shareName = name ? name : get(file, 'name');

    return this.get('onedataGraph').request({
        operation: 'create',
        gri: this.shareGriForFile(file),
        data: {
          name: shareName,
        },
        subscribe: false,
      })
      .then(({ shareId }) => this.getShare(shareId));
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
