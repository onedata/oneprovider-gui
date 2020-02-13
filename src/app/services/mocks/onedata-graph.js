/**
 * Mock of Onedata Websocket WebSocket API - Graph level service for Oneprovider
 *
 * @module services/mocks/onedata-graph
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OnedataGraphMock, { messageNotSupported } from 'onedata-gui-websocket-client/services/mocks/onedata-graph';
import { get, computed } from '@ember/object';
import _ from 'lodash';
import {
  numberOfFiles,
  numberOfDirs,
  generateFileEntityId,
  generateDirEntityId,
  parseDecodedDirEntityId,
} from 'oneprovider-gui/services/mock-backend';
import { inject as service } from '@ember/service';

const transferStatusToProgressState = {
  waiting: 'scheduled',
  ongoing: 'replicating',
  ended: 'completed',
};

const messageNotFound = Object.freeze({
  success: false,
  error: { id: 'notFound' },
  data: {},
});

const spaceHandlers = {
  transfers(operation, entityId, data) {
    if (operation !== 'get') {
      return messageNotSupported;
    }
    const allTransfers = this.get('mockBackend.entityRecords.transfer');
    const {
      state,
      offset,
      limit,
      page_token: index,
    } = data;
    let startPosition =
      Math.max(allTransfers.findIndex(t => get(t, 'index') === index), 0);
    let griList = allTransfers.filterBy('state', state).mapBy('id');
    startPosition = Math.max(startPosition + offset, 0);
    griList = griList.slice(startPosition, startPosition + limit);
    return {
      list: griList,
    };
  },
  transfers_throughput_charts(operation /*, entityId, data*/ ) {
    if (operation !== 'get') {
      return messageNotSupported;
    }
    const allProviders = this.get('mockBackend.entityRecords.provider');
    const firstProviderId = get(allProviders[0], 'entityId');
    return {
      timestamp: 1572261964,
      inputCharts: {
        [firstProviderId]: [
          1365758,
          1365758,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
        ],
      },
      outputCharts: {
        [firstProviderId]: [
          1365758,
          1365758,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
        ],
      },
    };
  },
  transfers_active_channels(operation) {
    if (operation !== 'get') {
      return messageNotSupported;
    }
    const allProviders = this.get('mockBackend.entityRecords.provider');
    const [
      firstProviderId,
      secondProviderId,
      thirdProviderId,
    ] = allProviders.slice(0, 3).mapBy('entityId');
    return {
      channelDestinations: {
        [firstProviderId]: [secondProviderId],
        [thirdProviderId]: [secondProviderId],
      },
    };
  },
  view(operation, /* entityId, data, authHint */ ) {
    if (operation !== 'get') {
      return messageNotSupported;
    }
    return {
      viewOptions: {
        hello: 'world',
        foo: 'bar',
      },
      spatial: false,
      revision: 1,
      reduceFunction: null,
      providers: [
        'oneprovider-1',
        'oneprovider-2',
      ],
      mapFunction: 'function (id, type, meta, ctx) {    if (type === \\"custom_metadata\\"){        if (meta[\\"license\\"]) {            return [meta[\\"license\\"], id];        }    }}',
      indexOptions: {
        lorem: 'ipsum',
      },
      gri: 'op_space.efd6e203d35061d5bef37a7e1636e8bbip2d5571458.view,test6:private',
    };
  },
};

const transferHandlers = {
  throughput_charts(operation /*, entityId, data*/ ) {
    if (operation !== 'get') {
      return messageNotSupported;
    }
    const allProviders = this.get('mockBackend.entityRecords.provider');
    const firstProviderId = get(allProviders[0], 'entityId');
    return {
      timestamp: 1572261964,
      charts: {
        [firstProviderId]: [
          1365758,
          1365758,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
        ],
      },
    };
  },
  progress(operation, entityId) {
    if (operation !== 'get') {
      return messageNotSupported;
    }
    const allTransfers = this.get('mockBackend.entityRecords.transfer');
    const transfer = allTransfers.findBy('entityId', entityId);
    if (!transfer) {
      return messageNotFound;
    }
    let status;
    if (this.get('cancelledTransfers').includes(transfer)) {
      status = 'cancelled';
    } else {
      status = transferStatusToProgressState[get(transfer, 'state')] || 'failed';
    }
    return {
      status,
      timestamp: Math.floor(Date.now() / 1000),
      replicatedBytes: Math.pow(1024, 3),
      replicatedFiles: 14,
      evictedFiles: 0,
    };
  },
  rerun(operation /*, entityId, data*/ ) {
    if (operation !== 'create') {
      return messageNotSupported;
    }
    return null;
  },
  cancel(operation, entityId /*, data*/ ) {
    if (operation !== 'delete') {
      return messageNotSupported;
    }
    const allTransfers = this.get('mockBackend.entityRecords.transfer');
    const transfer = allTransfers.findBy('entityId', entityId);
    this.get('cancelledTransfers').push(transfer);
    return null;
  },
};

const fileHandlers = {
  transfers(operation, entityId, data) {
    if (operation !== 'get') {
      return messageNotSupported;
    }
    const {
      include_ended_ids: includeEndedIds,
    } = data;
    const fileTransfers = this.get('mockBackend.entityRecords.transfer')
      .filterBy('dataSourceId', entityId);
    const ongoingIds = fileTransfers
      .filter(t => get(t, 'state') !== 'ended')
      .mapBy('entityId');
    const endedIds = fileTransfers
      .filterBy('state', 'ended')
      .mapBy('entityId');
    const response = {
      ongoingIds,
      endedCount: get(endedIds, 'length'),
    };
    if (includeEndedIds) {
      response.endedIds = endedIds;
    }
    return response;
  },
  children(operation, entityId, { index, limit, offset }) {
    if (operation !== 'get') {
      return messageNotSupported;
    }
    const decodedGuid = atob(entityId);
    if (decodedGuid.match(/0010/)) {
      return {
        success: false,
        error: { id: 'posix', details: { errno: 'eacces' } },
        data: {},
      };
    } else if (decodedGuid.match(/0011/)) {
      return {
        success: false,
        error: { id: 'posix', details: { errno: 'enoent' } },
        data: {},
      };
    } else {
      return {
        children: this.getMockChildrenSlice(entityId, index, limit, offset),
      };
    }
  },
};

export default OnedataGraphMock.extend({
  mockBackend: service(),

  childrenIdsCache: computed(() => ({})),

  cancelledTransfers: computed(() => []),

  init() {
    this._super(...arguments);
    const _handlers = Object.freeze({
      op_space: spaceHandlers,
      op_transfer: transferHandlers,
      file: fileHandlers,
    });
    this.set(
      'handlers',
      _.merge({}, this.get('handlers'), _handlers)
    );
  },

  getMockSpaceTransfersSlice(spaceId, state, index, limit = 100000000, offset = 0) {
    const mockSpaceTransfers = this.getMockSpaceTransfers(spaceId, state);
    let arrIndex = mockSpaceTransfers.findBy('index', index);
    if (arrIndex === -1) {
      arrIndex = 0;
    }
    return mockSpaceTransfers.slice(arrIndex + offset, arrIndex + offset + limit);
  },

  getMockChildrenSlice(dirEntityId, index, limit = 100000000, offset = 0) {
    const mockChildren = this.getMockChildren(dirEntityId);
    let arrIndex = mockChildren.findIndex(childEntityId =>
      atob(childEntityId) === index
    );
    if (arrIndex === -1) {
      arrIndex = 0;
    }
    return mockChildren.slice(arrIndex + offset, arrIndex + offset + limit);
  },

  getMockChildren(dirEntityId) {
    const childrenIdsCache = this.get('childrenIdsCache');
    const decodedDirEntityId = atob(dirEntityId);
    if (childrenIdsCache[dirEntityId]) {
      return childrenIdsCache[dirEntityId];
    } else {
      let cache;
      if (/.*#-dir-0000.*/.test(decodedDirEntityId)) {
        // root dir
        cache = [
          ..._.range(numberOfDirs).map(i =>
            generateDirEntityId(i, dirEntityId)
          ),
          ..._.range(numberOfFiles).map(i =>
            generateFileEntityId(i, dirEntityId)
          ),
        ];
      } else if (/.*dir-0000.*/.test(decodedDirEntityId)) {
        const rootParentEntityId = decodedDirEntityId
          .replace(/-dir-\d+/, '')
          .replace(/-c\d+/, '');
        const parentChildNumber = decodedDirEntityId
          .match(/.*dir-0000(-c(\d+))?.*/)[2] || -1;
        const newChildNumber = String(parseInt(parentChildNumber) + 1)
          .padStart(4, '0');
        cache = [
          generateDirEntityId(
            0,
            parseDecodedDirEntityId(rootParentEntityId).internalFileId,
            `-c${newChildNumber}`
          ),
        ];
      } else {
        cache = [];
      }
      childrenIdsCache[dirEntityId] = cache;
      return cache;
    }
  },

  removeMockChild(dirEntityId, childEntityId) {
    const childrenIdsCache = this.get('childrenIdsCache');
    _.remove(childrenIdsCache[dirEntityId], fileId => fileId.match(childEntityId));
  },
});
