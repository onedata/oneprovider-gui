/**
 * Provides model functions related to spaces.
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service from '@ember/service';
import { getProperties, set } from '@ember/object';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { inject as service } from '@ember/service';
import { entityType as spaceEntityType } from 'oneprovider-gui/models/space';
import { all as allFulfilled } from 'rsvp';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';

/**
 * @typedef DbView
 * @property {boolean} spatial
 * @property {Object} viewOptions
 * @property {Object} indexOptions
 * @property {String} mapFunction
 * @property {String} reduceFunction
 * @property {Array<String>} providers
 */

/**
 * @typedef {Object} DirStatsServiceState
 * @property {string} status One of `enabled`, `disabled`, `stopping`, `initializing`
 * @property {number} since
 */

/**
 * @param {string} spaceId
 * @param {{ aspect: string?, scope: string? }} griOptions
 * @returns {string}
 */
export function getGri(spaceId, { aspect = 'instance', scope = 'private' } = {}) {
  return gri({
    entityType: spaceEntityType,
    entityId: spaceId,
    aspect,
    scope,
  });
}

export default Service.extend({
  onedataGraph: service(),
  store: service(),
  providerManager: service(),

  /**
   * Mapping (space ID) -> PromiseObject<DirStatsServiceState>
   * @type {Object<string, PromiseObject<DirStatsServiceState>>}
   */
  dirsStatsServiceStateCache: undefined,

  init() {
    this._super(...arguments);
    this.set('dirsStatsServiceStateCache', {});
  },

  getSpace(spaceId) {
    return this.get('store').findRecord('space', getGri(spaceId));
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
   * defined for storages supporting the space with `spaceId`
   * (object properties: `{ stringValues: Array, numberValues: Array }`).
   * @param {String} spaceId
   * @returns {Promise<Object>}
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
   * @returns {Promise<{ expressionRpn: Array, matchingStorages: Array<StorageModel> }>}
   */
  evaluateQosExpression(spaceId, expression) {
    const {
      providerManager,
      onedataGraph,
    } = this.getProperties('providerManager', 'onedataGraph');
    return onedataGraph.request({
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
            /**
             * @typedef {StorageModel}
             * @param {String} entityId
             * @param {String} name
             * @param {Models/Provider} provider
             */
            .then(provider => ({
              entityId: storage.id,
              name: storage.name,
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

  /**
   * @param {String} spaceId
   * @returns {Promise<Array<StorageModel>>}
   */
  getSupportingStorages(spaceId) {
    return this.evaluateQosExpression(spaceId, 'anyStorage')
      .then(({ matchingStorages }) => matchingStorages);
  },

  /**
   * @param {string} spaceId
   * @param {boolean} [reload]
   * @returns {PromiseObject<DirStatsServiceState>}
   */
  async getDirStatsServiceState(spaceId, reload = false) {
    const existingProxy = this.dirsStatsServiceStateCache[spaceId];
    if (existingProxy && (!reload || existingProxy.isPending)) {
      return existingProxy;
    }

    const requestGri = dirStatsServiceStateGri(spaceId);
    const promise = this.onedataGraph.request({
      gri: requestGri,
      operation: 'get',
      subscribe: false,
    });

    if (existingProxy?.isFulfilled) {
      const result = await promise;
      set(existingProxy, 'content', result);
      return existingProxy;
    } else {
      return this.dirsStatsServiceStateCache[spaceId] = promiseObject(promise);
    }
  },
});

/**
 * @param {string} spaceId
 * @returns {string}
 */
export function dirStatsServiceStateGri(spaceId) {
  return gri({
    entityType: spaceEntityType,
    entityId: spaceId,
    aspect: 'dir_stats_service_state',
    scope: 'private',
  });
}
