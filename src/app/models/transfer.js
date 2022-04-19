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

const endedStates = [
  'completed',
  'skipped',
  'cancelled',
  'failed',
];

export const entityType = 'op_transfer';

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
     * @type {String}
     * One of: 'migration', 'eviction', 'replication'
     */
    type: attr('string'),

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
     * @param {string} spaceId
     * @returns {Promise<Models.User>}
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
