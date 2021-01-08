/**
 * Backend operations for QoS
 * 
 * @module services/qos-manager
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { entityType as qosEntityType } from 'oneprovider-gui/models/qos-requirement';
import { get } from '@ember/object';

export function getGri(entityId, scope) {
  return gri({
    entityType: qosEntityType,
    entityId: entityId,
    aspect: 'instance',
    scope,
  });
}

export default Service.extend({
  store: service(),
  onedataGraph: service(),

  async getRecord(qosGri, reload = false) {
    const cachedRecord = reload ?
      null : this.get('store').peekRecord('qosRequirement', qosGri);
    if (!cachedRecord) {
      return await this.get('store').findRecord('qosRequirement', qosGri);
    } else {
      return cachedRecord;
    }
  },

  getRecordById(entityId, scope = 'private') {
    return this.getRecord(getGri(entityId, scope));
  },

  createQosRequirement(file, expression, replicasNum) {
    return this.get('store').createRecord('qosRequirement', {
      replicasNum,
      _meta: {
        additionalData: {
          fileId: get(file, 'cdmiObjectId'),
          expression,
        },
      },
    }).save();
  },

  removeQosRequirement(qosRequirement) {
    return qosRequirement.destroyRecord();
  },
});
