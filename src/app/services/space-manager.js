/**
 * Provides model functions related to spaces.
 * 
 * @module services/space-manager
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service from '@ember/service';
import { getProperties } from '@ember/object';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { inject as service } from '@ember/service';
import { entityType as spaceEntityType } from 'oneprovider-gui/models/space';

/**
 * @typedef DbView
 * @property {boolean} spatial
 * @property {Object} viewOptions
 * @property {Object} indexOptions
 * @property {String} mapFunction
 * @property {String} reduceFunction
 * @property {Array<String>} providers
 */

export default Service.extend({
  onedataGraph: service(),
  store: service(),

  getSpace(spaceId) {
    const requestGri = gri({
      entityType: spaceEntityType,
      entityId: spaceId,
      aspect: 'instance',
      scope: 'private',
    });
    return this.get('store').findRecord('space', requestGri);
  },

  /**
   * @param {Models.Space} space 
   * @param {String} dbViewName 
   * @returns {Promise<DbView>}
   */
  getDbView(space, dbViewName) {
    const {
      entityType,
      entityId,
    } = getProperties(space, 'entityType', 'entityId');
    const requestGri = gri({
      entityType,
      entityId,
      aspect: 'view',
      aspectId: dbViewName,
      scope: 'private',
    });
    return this.get('onedataGraph').request({
      operation: 'get',
      gri: requestGri,
      subscribe: false,
    });
  },

  /**
   * Resolves mapping: QoS parameter key -> Object with string and number values
   * defined for storages supporting the space with `spaceId`.
   * @param {String} spaceId
   * @returns {Promise<Object<String, { stringValues: Array, numberValues: Array }>>} 
   */
  getAvailableQosParameters(spaceId) {
    return this.get('onedataGraph').request({
      operation: 'get',
      gri: gri({
        entityType: spaceEntityType,
        entityId: spaceId,
        aspect: 'available_qos_parameters',
      }),
      subscribe: false,
    }).then(({ qosParameters }) => qosParameters);
  },
});
