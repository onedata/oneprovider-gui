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

const messagePosixError = (errno) => ({
  id: 'posix',
  details: { errno },
  description: `Operation failed with POSIX error: ${errno}.`,
});

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
  xattrs(operation, entityId, data) {
    if (operation === 'get') {
      return {
        metadata: _.cloneDeep(metaXattrs),
      };
    } else if (operation === 'create') {
      const xattrs = data.metadata;
      for (const key in xattrs) {
        metaXattrs[key] = xattrs[key];
      }
      return {};
    } else if (operation === 'delete') {
      const keys = data.keys;
      keys.forEach(key => {
        delete metaXattrs[key];
      });
      return {};
    } else {
      return messageNotSupported;
    }
  },
  json_metadata(operation, entityId, data) {
    if (operation === 'get') {
      if (this.get('emptyJsonMetadata')) {
        return messagePosixError('enodata');
      } else {
        return {
          metadata: this.get('metaJson'),
        };
      }
    } else if (operation === 'create') {
      this.set('metaJson', data && data.metadata);
      this.set('emptyJsonMetadata', false);
      return {};
    } else if (operation === 'delete') {
      this.set('emptyJsonMetadata', true);
      this.set('metaJson', null);
      return {};
    } else {
      return messageNotSupported;
    }
  },
  rdf_metadata(operation, entityId, data) {
    if (operation === 'get') {
      return {
        metadata: this.get('metaRdf'),
      };
    } else if (operation === 'create') {
      this.set('metaRdf', data && data.metadata);
      return {};
    } else if (operation === 'delete') {
      this.set('metaRdf', null);
      return {};
    } else {
      return messageNotSupported;
    }
  },
};

const metaJson = {
  query: {
    count: 10,
    created: '2011-06-21T08:10:46Z',
    lang: 'en-US',
    results: {
      photo: [{
          farm: '6',
          id: '5855620975',
          isfamily: '0',
          isfriend: '0',
          ispublic: '1',
          owner: '32021554@N04',
          secret: 'f1f5e8515d',
          server: '5110',
          title: '7087 bandit cat',
        },
        {
          farm: '4',
          id: '5856170534',
          isfamily: '0',
          isfriend: '0',
          ispublic: '1',
          owner: '32021554@N04',
          secret: 'ff1efb2a6f',
          server: '3217',
          title: '6975 rusty cat',
        },
        {
          farm: '6',
          id: '5856172972',
          isfamily: '0',
          isfriend: '0',
          ispublic: '1',
          owner: '51249875@N03',
          secret: '6c6887347c',
          server: '5192',
          title: 'watermarked-cats',
        },
        {
          farm: '6',
          id: '5856168328',
          isfamily: '0',
          isfriend: '0',
          ispublic: '1',
          owner: '32021554@N04',
          secret: '0c1cfdf64c',
          server: '5078',
          title: '7020 mandy cat',
        },
        {
          farm: '3',
          id: '5856171774',
          isfamily: '0',
          isfriend: '0',
          ispublic: '1',
          owner: '32021554@N04',
          secret: '7f5a3180ab',
          server: '2696',
          title: '7448 bobby cat',
        },
      ],
    },
  },
};

const metaRdf = `<?xml version="1.0" encoding="UTF-8"?>
<query xmlns:yahoo="http://www.yahooapis.com/v1/base.rng"
    yahoo:count="7" yahoo:created="2011-10-11T08:40:23Z" yahoo:lang="en-US">
    <diagnostics>
        <publiclyCallable>true</publiclyCallable>
        <url execution-start-time="0" execution-stop-time="25" execution-time="25"><![CDATA[http://where.yahooapis.com/v1/continents;start=0;count=10]]></url>
        <user-time>26</user-time>
        <service-time>25</service-time>
        <build-version>21978</build-version>
    </diagnostics> 
    <results>
        <place xmlns="http://where.yahooapis.com/v1/schema.rng"
            xml:lang="en-US" yahoo:uri="http://where.yahooapis.com/v1/place/24865670">
            <woeid>24865670</woeid>
            <placeTypeName code="29">Continent</placeTypeName>
            <name>Africa</name>
        </place>
        <place xmlns="http://where.yahooapis.com/v1/schema.rng"
            xml:lang="en-US" yahoo:uri="http://where.yahooapis.com/v1/place/24865675">
            <woeid>24865675</woeid>
            <placeTypeName code="29">Continent</placeTypeName>
            <name>Europe</name>
        </place>
        <place xmlns="http://where.yahooapis.com/v1/schema.rng"
            xml:lang="en-US" yahoo:uri="http://where.yahooapis.com/v1/place/24865673">
            <woeid>24865673</woeid>
            <placeTypeName code="29">Continent</placeTypeName>
            <name>South America</name>
        </place>
        <place xmlns="http://where.yahooapis.com/v1/schema.rng"
            xml:lang="en-US" yahoo:uri="http://where.yahooapis.com/v1/place/28289421">
            <woeid>28289421</woeid>
            <placeTypeName code="29">Continent</placeTypeName>
            <name>Antarctic</name>
        </place>
        <place xmlns="http://where.yahooapis.com/v1/schema.rng"
            xml:lang="en-US" yahoo:uri="http://where.yahooapis.com/v1/place/24865671">
            <woeid>24865671</woeid>
            <placeTypeName code="29">Continent</placeTypeName>
            <name>Asia</name>
        </place>
        <place xmlns="http://where.yahooapis.com/v1/schema.rng"
            xml:lang="en-US" yahoo:uri="http://where.yahooapis.com/v1/place/24865672">
            <woeid>24865672</woeid>
            <placeTypeName code="29">Continent</placeTypeName>
            <name>North America</name>
        </place>
        <place xmlns="http://where.yahooapis.com/v1/schema.rng"
            xml:lang="en-US" yahoo:uri="http://where.yahooapis.com/v1/place/55949070">
            <woeid>55949070</woeid>
            <placeTypeName code="29">Continent</placeTypeName>
            <name>Australia</name>
        </place>
    </results>
</query>
`;

const metaXattrs = {
  one: 'hello',
  two: 'world',
  three: 'foo',
};

export default OnedataGraphMock.extend({
  mockBackend: service(),

  childrenIdsCache: computed(() => ({})),

  cancelledTransfers: computed(() => []),

  emptyJsonMetadata: true,

  metaJson,

  metaRdf,

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
