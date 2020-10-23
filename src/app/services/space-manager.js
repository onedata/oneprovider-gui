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
import { all as allFulfilled } from 'rsvp';

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
  providerManager: service(),

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

  /**
   * Validate, convert infix QoS expression to RPN and return list of matching storages
   * @param {String} spaceId
   * @param {String} expression
   * @returns {Promise<Object<String, { expressionRpn: Array, matchingStorages: Array }>>} 
   */
  evaluateQosExpression(spaceId, expression) {
    const providerManager = this.get('providerManager');
    return this.get('onedataGraph').request({
      operation: 'create',
      gri: gri({
        entityType: spaceEntityType,
        entityId: spaceId,
        aspect: 'evaluate_qos_expression',
      }),
      data: { expression },
      subscribe: false,
    }).then(({ matchingStorages, expressionRpn }) => {
      return allFulfilled(matchingStorages.map(storage => {
          return providerManager.getProviderById(storage.providerId)
            .then(provider => ({
              id: storage.id,
              entityId: storage.id,
              name: storage.name,
              providerId: storage.providerId,
              provider,
            }));
        }))
        .then(storageModels => {
          return {
            matchingStorages: storageModels,
            expressionRpn,
          };
        });
    });
  },

  getSupportingStorages(spaceId) {
    return this.evaluateQosExpression(spaceId, 'anyStorage')
      .then(({ matchingStorages }) => matchingStorages);
  },
});
