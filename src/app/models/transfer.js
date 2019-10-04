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

const backendEpochInfinity = 9999999999;
const linkNameIdPartLength = 6;

export default Model.extend(GraphSingleModelMixin, {
  index: computed('entityId', 'scheduleTime', 'finishTime', function index() {
    const {
      entityId,
      scheduleTime,
      finishTime,
    } = this.getProperties('entityId', 'scheduleTime', 'finishTime');
    const timestamp = finishTime || scheduleTime;
    return `${backendEpochInfinity - timestamp}${entityId.slice(0, linkNameIdPartLength)}`;
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

  /**
   * Creator of transfer entityId
   */
  userId: attr('string'),

  queryParams: attr('string'),

  scheduleTime: attr('number'),

  startTime: attr('number'),

  finishTime: attr('number'),

  // transferProgress: belongsTo('transferProgress'),

  // minuteChart: belongsTo('throughputChart'),
  // hourChart: belongsTo('throughputChart'),
  // dayChart: belongsTo('throughputChart'),
  // monthChart: belongsTo('throughputChart'),

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
   * Destination of this transfer
   * @type {Models.Oneprovider}
   */
  replicatingProvider: belongsTo('provider'),

  /**
   * Oneprovider that will evict the file after this transfer
   * @type {Models.Oneprovider}
   */
  evictingProvider: belongsTo('provider'),

  init() {
    this.user =
      promise.object(
        computed('data.user', function space() {

        })
      );
    this._super(...arguments);
  },

  getUser() {
    const {
      userId: userEntityId,
      spaceId: spaceEntityId,
      store,
    } = this.getProperties('userId', 'spaceId', 'store');
    const userGri = gri({
      entityType: 'op-user',
      entityId: userEntityId,
      scope: 'private',
      aspect: 'instance',
    });
    return store.findRecord('user', userGri, {
      adapterOptions: {
        _meta: {
          authHint: ['throughSpace', spaceEntityId],
        },
      },
    });
  },

  // FIXME: removed viewName (dataSourceName)
  // FIXME: removed path (dataSourceName)

}).reopenClass(StaticGraphModelMixin);
