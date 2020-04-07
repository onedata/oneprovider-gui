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
import { computed, get } from '@ember/object';
import { resolve, reject } from 'rsvp';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { inject as service } from '@ember/service';
import { entityType as userEntityType } from 'oneprovider-gui/models/user';

const backendEpochInfinity = 9999999999;
const linkNameIdPartLength = 6;

const endedStates = [
  'completed',
  'skipped',
  'cancelled',
  'failed',
];

export const entityType = 'op_transfer';

// TODO: use collection type

export function computeTransferIndex(entityId, scheduleTime, finishTime) {
  const timestamp = finishTime || scheduleTime;
  // "ip2" is a separator used with ids in database (the name was probably
  // a mistake and should be "id2", but it's not our business)
  const firstIdPartMatch = entityId.match(/(.*)(ip2.*)/);
  const idForIndex = firstIdPartMatch && firstIdPartMatch[1] || entityId;
  return `${backendEpochInfinity - timestamp}${(idForIndex).slice(0, linkNameIdPartLength)}`;
}

/**
 * @typedef {Object} TransferProgress
 * @property {String} status one of:
 *   waiting, replicating, evicting, aborting, skipped, completed, cancelled,
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

    /**
     * Helper property for `isCancelling` computed property.
     * @type {boolean}
     */
    _isCancelling: false,

    /**
     * An index for querying backend for record in selected range
     * @type {ComputedProperty<string>}
     */
    index: computed('entityId', 'scheduleTime', 'finishTime', function index() {
      const {
        entityId,
        scheduleTime,
        finishTime,
      } = this.getProperties('entityId', 'scheduleTime', 'finishTime');
      return computeTransferIndex(entityId, scheduleTime, finishTime);
    }),

    /**
     * If true, the transfer is in progress (should be in ongoing transfers collection)
     */
    isOngoing: attr('boolean'),

    /**
     * Path of the file/dir or name of db index
     */
    dataSourceName: attr('string'),

    /**
     * One of: file, dir, deleted, view, unknown
     */
    dataSourceType: attr('string'),

    /**
     * EntityId of dataSource (file or db-view model)
     */
    dataSourceId: attr('string'),

    /**
     * EntityId of transfer creator
     */
    userId: attr('string'),

    queryParams: attr('object'),

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

    /**
     * @type {String|null}
     * One of: waiting, ongoing, ended
     */
    state: computed('scheduleTime', 'startTime', 'finishTime', function state() {
      const {
        scheduleTime,
        startTime,
        finishTime,
      } = this.getProperties('scheduleTime', 'startTime', 'finishTime');
      return finishTime && 'ended' ||
        startTime && 'ongoing' ||
        scheduleTime && 'waiting' ||
        null;
    }),

    /**
     * @type {String}
     * One of: migration, eviction, replication
     */
    type: computed('evictingProvider', 'replicatingProvider', function type() {
      const evictingProviderGri = this.belongsTo('evictingProvider').id();
      if (evictingProviderGri) {
        const replicatingProviderGri =
          this.belongsTo('replicatingProvider').id();
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
     * If true, user has invoked transfer cancellation
     * @type {boolean}
     */
    isCancelling: computed(
      '_isCancelling',
      'transferProgress.status',
      'isEnded', {
        get() {
          const {
            transferProgress,
            isEnded,
            _isCancelling,
          } = this.getProperties('_isCancelling', 'isEnded', 'transferProgress');
          const isAborting = transferProgress ?
            get(transferProgress, 'status') === 'aborting' : undefined;

          // if transfer is finished, then cancelling is not possible
          return isAborting || (_isCancelling && !isEnded);
        },
        set(key, value) {
          const {
            transferProgress,
            isEnded,
          } = this.getProperties('transferProgress', 'isEnded');
          const isAborting = transferProgress ?
            get(transferProgress, 'status') === 'aborting' : undefined;
          this.set('_isCancelling', value);
          return isAborting || (value && !isEnded);
        },
      }
    ),

    /**
     * @type {ComputedProperty<boolean>}
     */
    isEnded: computed(
      'state',
      'transferProgress.status',
      function isEnded() {
        return this.get('state') === 'ended' ||
          endedStates.includes(this.get('transferProgress.status'));
      }
    ),

    /**
     * @override
     * @returns {TransferProgress}
     */
    fetchTransferProgress() {
      return this.get('transferManager').getTransferProgress(this);
    },

    /**
     * 
     * @param {string} spaceId 
     * @return {Promise<Models.User>}
     */
    fetchUser(spaceId) {
      const {
        store,
        userId,
      } = this.getProperties('store', 'userId');
      // TODO: doesn't work for mock mode, which uses: entity type user and scope private
      const entityType = userEntityType;
      const scope = 'shared';
      const userGri = gri({
        entityType,
        entityId: userId,
        scope,
        aspect: 'instance',
      });
      const localStoredUser = store.peekRecord('user', userGri);
      if (localStoredUser) {
        return resolve(localStoredUser);
      } else {
        return store.findRecord('user', userGri, {
          adapterOptions: {
            _meta: {
              authHint: ['throughSpace', spaceId],
            },
          },
        });
      }
    },
  }
).reopenClass(StaticGraphModelMixin);