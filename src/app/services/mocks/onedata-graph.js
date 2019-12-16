/**
 * Mock of Onedata Websocket WebSocket API - Graph level service for Oneprovider
 *
 * @module services/mocks/onedata-graph
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OnedataGraphMock, { messageNotSupported } from 'onedata-gui-websocket-client/services/mocks/onedata-graph';
import { get } from '@ember/object';
import _ from 'lodash';

const transferStatusToProgressState = {
  waiting: 'scheduled',
  ongoing: 'replicating',
  ended: 'completed',
};

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
    const firstProviderId = get(allProviders[0], 'entityId');
    const secondProviderId = get(allProviders[1], 'entityId');
    const thirdProviderId = get(allProviders[2], 'entityId');
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
    const status = transferStatusToProgressState[get(transfer, 'state')] || 'failed';
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
    // TODO: complete the mock: change status of transfer to reruned
    return null;
  },
  instance(operation /*, entityId, data*/ ) {
    if (operation !== 'delete') {
      return messageNotSupported;
    }
    // TODO: complete the mock: change status of transfer to cancelled
    return null;
  },
};

const providerHandlers = {
  spaces(operation, entityId) {
    if (operation === 'get') {
      return {
        gri: `provider.${entityId}.spaces`,
        list: ['space1', 'space2', 'space3', 'space4'],
      };
    } else {
      return messageNotSupported;
    }
  },
};

const fileHandlers = {
  transfers(operation, entityId, data) {
    if (operation !== 'get') {
      return messageNotSupported;
    }
    const {
      include_ended_list: includeEndedList,
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
    if (includeEndedList) {
      response.endedIds = endedIds;
    }
    return response;
  },
};

export default OnedataGraphMock.extend({
  _handlers: Object.freeze({
    op_provider: providerHandlers,
    op_space: spaceHandlers,
    op_transfer: transferHandlers,
    file: fileHandlers,
  }),

  init() {
    this._super(...arguments);
    this.set(
      'handlers',
      _.merge({}, this.get('handlers'), this.get('_handlers'))
    );
  },
});
