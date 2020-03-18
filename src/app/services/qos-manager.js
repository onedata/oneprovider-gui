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
import { entityType as qosEntityType } from 'oneprovider-gui/models/qos';
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

  getRecord(qosGri) {
    return this.get('store').findRecord('qos', qosGri);
  },

  getRecordById(entityId, scope = 'private') {
    return this.getRecord(getGri(entityId, scope));
  },

  createQos(file, expression, replicasNum) {
    return this.get('store').createRecord('qos', {
      expression,
      replicasNum,
      _meta: {
        additionalData: {
          fileId: get(file, 'cdmiObjectId'),
        },
      },
    }).save();
  },

  removeQos(qos) {
    return qos.destroyRecord();
  },
});
