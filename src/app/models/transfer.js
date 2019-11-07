/**
 * @module models/transfer
 * @author Michał Borzęcki, Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { promise } from 'ember-awesome-macros';
import { computed } from '@ember/object';
import reject from 'rsvp';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
// import { entityType as userEntityType } from 'oneprovider-gui/models/user';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { inject as service } from '@ember/service';

const backendEpochInfinity = 9999999999;
const linkNameIdPartLength = 6;

export const entityType = 'op_transfer';

export function computeTransferIndex(entityId, scheduleTime, finishTime) {
  const timestamp = finishTime || scheduleTime;
  return `${backendEpochInfinity - timestamp}${entityId.slice(0, linkNameIdPartLength)}`;
}

/**
 * @typedef {Object} TransferProgress
 * @property {String} status one of:
 *   scheduled, replicating, evicting, aborting, skipped, completed, cancelled,
 *   failed
 * @property {Number} timestamp
 * @property {Number} replicatedBytes
 * @property {Number} replicatedFiles
 * @property {Number} evictedFiles
 */

export default Model.extend(
  GraphSingleModelMixin,
  createDataProxyMixin('transferProgress'), {
    transferManager: service(),

    index: computed('entityId', 'scheduleTime', 'finishTime', function index() {
      const {
        entityId,
        scheduleTime,
        finishTime,
      } = this.getProperties('entityId', 'scheduleTime', 'finishTime');
      return computeTransferIndex(entityId, scheduleTime, finishTime);
    }),

    /**
     * If true, the transfer is in progress (should be in current transfers collection)
     */
    isOngoing: attr('boolean'),

    dataSourceName: attr('string'),

    /**
     * One of: file, dir, deleted, view, unknown
     */
    dataSourceType: attr('string'),

    /**
     * EntityId of dataSource (file or db-view model)
     */
    dataSourceId: attr('string'),

    // FIXME: maybe it should be userId
    /**
     * Creator of transfer entityId
     * On init time it gets a GRI string, then this field is converted
     */
    user: attr('string'),

    queryParams: attr('string'),

    scheduleTime: attr('number'),

    startTime: attr('number'),

    finishTime: attr('number'),

    /**
     * Destination of this transfer
     * @type {Models.Provider}
     */
    replicatingProvider: belongsTo('provider'),

    /**
     * Oneprovider that will evict the file after this transfer
     * @type {Models.Provider}
     */
    evictingProvider: belongsTo('provider'),

    userProxy: promise.object(computed('userId', 'spaceId', function userProxy() {
      return this.fetchUser();
    })),

    // FIXME: temporary
    userId: computed('user', function userId() {
      return parseGri(this.get('user')).entityId;
    }),

    /**
     * @type {String}
     * One of: scheduled, current, completed
     */
    state: computed('scheduleTime', 'startTime', 'finishTime', function state() {
      const {
        scheduleTime,
        startTime,
        finishTime,
      } = this.getProperties('scheduleTime', 'startTime', 'finishTime');
      return finishTime && 'completed' ||
        startTime && 'current' ||
        scheduleTime && 'scheduled';
    }),

    /**
     * @type {String}
     * One of: migration, eviction, replication
     */
    type: computed('evictingProvider', 'replicatingProvider', function type() {
      const evictingProviderGri = this.belongsTo('evictingProvider').id();
      if (evictingProviderGri) {
        const replicatingProviderGri =
          this.belongsTo('replicatingProviderGri').id();
        return replicatingProviderGri ? 'migration' : 'eviction';
      } else {
        return 'replication';
      }
    }),

    dataSource: promise.object(
      computed('dataSourceType', 'dataSourceId', function dataSource() {
        const {
          dataSourceType,
          dataSourceId: entityId,
          store,
        } = this.getProperties('dataSourceType', 'dataSourceId', 'store');
        let entityType;
        let modelType;
        switch (dataSourceType) {
          case 'file':
          case 'dir':
            entityType = 'file';
            modelType = 'file';
            break;
          case 'view':
            entityType = 'op_view';
            modelType = 'db-view';
            break;
          default:
            break;
        }
        if (entityType) {
          const dataSourceGri = gri({
            entityType,
            entityId,
            scope: 'private',
            aspect: 'instance',
          });
          return store.findRecord(modelType, dataSourceGri);
        } else {
          return reject();
        }
      })
    ),

    /**
     * @override
     * @returns {TransferProgress}
     */
    fetchTransferProgress() {
      return this.get('transferManager').getTransferProgress(this);
    },

    fetchUser() {
      const {
        store,
        userId,
        spaceId,
      } = this.getProperties('store', 'userId', 'spaceId');
      // FIXME: for backend
      // const entityType = userEntityType;
      // const scope = 'shared';
      // FIXME: for development mock mode
      const entityType = 'user';
      const scope = 'private';
      const userGri = gri({

        entityType,
        entityId: userId,
        scope,
        aspect: 'instance',
      });
      return store.findRecord('user', userGri, {
        adapterOptions: {
          _meta: {
            authHint: ['throughSpace', spaceId],
          },
        },
      });
    },

    // FIXME: removed viewName (dataSourceName)
    // FIXME: removed path (dataSourceName)

  }
).reopenClass(StaticGraphModelMixin);
