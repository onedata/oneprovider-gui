/**
 * Mock of Onedata Websocket WebSocket API - Graph level service for Oneprovider
 *
 * @module services/mocks/onedata-graph
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OnedataGraphMock, { messageNotSupported } from 'onedata-gui-websocket-client/services/mocks/onedata-graph';
import { get, getProperties, computed } from '@ember/object';
import _ from 'lodash';
import {
  numberOfFiles,
  numberOfDirs,
  generateFileEntityId,
  generateDirEntityId,
  parseDecodedDirEntityId,
  storageIdAlpha,
  storageIdBeta,
} from 'oneprovider-gui/services/mock-backend';
import { inject as service } from '@ember/service';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';

const messagePosixError = (errno) => ({
  success: false,
  error: {
    id: 'posix',
    details: { errno },
    description: `Operation failed with POSIX error: ${errno}.`,
  },
  data: {},
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
  available_qos_parameters(operation, ) {
    if (operation !== 'get') {
      return messageNotSupported;
    }
    return {
      qosParameters: this.get('qosParameters'),
    };
  },
  evaluate_qos_expression(operation, entityId, data) {
    if (operation != 'create') {
      return messageNotSupported;
    }
    /** @type {string} */
    const expression = data && data.expression;
    if (!expression) {
      return {
        success: false,
        error: {
          id: 'invalidQosExpression',
          details: { reason: 'expression cannot be empty' },
        },
        data: {},
      };
    } else if (!expression.includes('=') && !expression.trim().includes('anyStorage')) {
      return {
        success: false,
        error: {
          id: 'invalidQosExpression',
          details: { reason: 'syntax error before: ' },
        },
        data: {},
      };
    } else if (expression.trim().endsWith('=')) {
      return {
        success: false,
        error: {
          id: 'invalidQosExpression',
          details: { reason: 'syntax error before: "="' },
        },
        data: {},
      };
    } else if (expression.includes('*')) {
      return {
        success: false,
        error: {
          id: 'invalidQosExpression',
          details: { reason: 'illegal characters "*"' },
        },
        data: {},
      };
    } else if (expression === 'hack') {
      return {
        success: false,
        error: {
          id: 'internalServerError',
          description: 'You tried to hack the system.',
        },
        data: {},
      };
    } else if (expression === 'anyStorage\\anyStorage') {
      return {
        expressionRpn: ['anyStorage', 'anyStorage', '\\'],
        matchingStorages: [],
      };
    } else {
      const allProviders = this.get('mockBackend.entityRecords.provider');
      return {
        expressionRpn: [
          'hello',
          'world',
          '=',
          'foo',
          '1',
          '>=',
          '|',
          'priority',
          '2',
          '=',
          '&',
          'storageId',
          '123',
          '=',
          '\\',
          'storageId',
          storageIdAlpha,
          '=',
          '&',
          'providerId',
          '456',
          '=',
          '&',
          'providerId',
          allProviders ? get(allProviders[0], 'entityId') : 'test_provider_id',
          '=',
          '&',
        ],
        matchingStorages: allProviders ? [{
            id: storageIdAlpha,
            name: 'Alpha storage with very long name',
            providerId: get(allProviders[0], 'entityId'),
          },
          {
            id: storageIdBeta,
            name: 'Beta storage',
            providerId: get(allProviders[1], 'entityId'),
          },
        ] : [],
      };
    }
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
  children_details(operation, entityId, { index, limit, offset }) {
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
      const children = this.getMockChildrenSlice({
        type: 'data',
        entityId,
        index,
        limit,
        offset,
      });
      const isLast = children.length < limit;
      return {
        children,
        isLast,
      };
    }
  },
  symlink_target(operation, entityId) {
    switch (operation) {
      case 'get':
        return this.getSymlinkLinkedFile(entityId);
      default:
        return messageNotSupported;
    }
  },
  xattrs(operation, entityId, data) {
    switch (operation) {
      case 'get': {
        return {
          metadata: this.get('emptyXattrsMetadata') ? null : _.cloneDeep(metaXattrs),
        };
      }
      case 'create': {
        const xattrs = data.metadata;
        for (const key in xattrs) {
          metaXattrs[key] = xattrs[key];
        }
        return {};
      }
      case 'delete': {
        const keys = data.keys;
        keys.forEach(key => {
          delete metaXattrs[key];
        });
        return {};
      }
      default:
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
      if (this.get('emptyRdfMetadata')) {
        return messagePosixError('enodata');
      } else {
        return {
          metadata: this.get('metaRdf'),
        };
      }
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
  'one': 'hello',
  'very long name of the key test test test test test test test test test test test test test test test test test test': 'very long value of the xattr world world world world world world world world world world world world world world world world world world world world world world',
  'three': 'foo',
};

export default OnedataGraphMock.extend({
  mockBackend: service(),

  childrenIdsCache: computed(() => ({})),
  childrenDetailsCache: computed(() => ({})),

  cancelledTransfers: computed(() => []),

  emptyJsonMetadata: false,
  emptyRdfMetadata: false,
  emptyXattrsMetadata: false,
  metaJson,
  metaRdf,

  qosParameters: computed(function qosParameters() {
    const allProviders = this.get('mockBackend.entityRecords.provider') || [];
    return {
      storageId: {
        stringValues: [
          storageIdAlpha,
          storageIdBeta,
        ],
        numberValues: [],
      },
      providerId: {
        stringValues: allProviders.mapBy('entityId'),
        numberValues: [],
      },
      storageType: {
        stringValues: ['posix', 'cephrados', 'webdav'],
        numberValues: [],
      },
      myCustomParameter: {
        stringValues: [
          'one',
          'two',
          'Mollit amet nostrud occaecat est mollit magna irure Lorem laboris exercitation elit.',
          'averylongtextwithoutspacesaverylongtextwithoutspacesaverylongtextwithoutspaces',
        ],
        numberValues: [10, 23, 36],
      },
      priority: {
        stringValues: [],
        numberValues: [1, 2, 3, 4],
      },
    };
  }),

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

  /**
   * @param {string} type one of: id, data
   * @param {string} entityId directory entity is for listing
   * @param {string} index
   * @param {Number} limit
   * @param {Number} offset
   * @returns {Array<any>}
   */
  getMockChildrenSlice({ type, entityId, index, limit = 1000, offset = 0 }) {
    let mockChildren;
    let arrIndex;
    if (type === 'data') {
      mockChildren = this.getMockChildrenData(entityId);
      arrIndex = mockChildren.findIndex(fileData => {
        const childId = get(fileData, 'guid');
        return atob(childId).endsWith(index);
      });
    } else if (type === 'id') {
      mockChildren = this.getMockChildrenIds(entityId);
      arrIndex = mockChildren.findIndex(childId =>
        atob(childId).endsWith(index)
      );
    }
    if (arrIndex === -1) {
      arrIndex = 0;
    }
    return mockChildren.slice(arrIndex + offset, arrIndex + offset + limit);
  },

  getMockChildrenIds(dirId) {
    const childrenIdsCache = this.get('childrenIdsCache');
    const decodedDirEntityId = atob(dirId);
    if (childrenIdsCache[dirId]) {
      return childrenIdsCache[dirId];
    } else {
      let cache;
      if (/.*#-dir-0000.*/.test(decodedDirEntityId)) {
        // root dir
        cache = [
          ..._.range(numberOfDirs).map(i =>
            generateDirEntityId(i, dirId)
          ),
          ..._.range(numberOfFiles).map(i =>
            generateFileEntityId(i, dirId)
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
      childrenIdsCache[dirId] = cache;
      return cache;
    }
  },

  getSymlinkLinkedFile(symlinkEntityId) {
    const linkedFileEntityId = this.get('mockBackend.symlinkMap')[symlinkEntityId];
    if (!linkedFileEntityId) {
      return null;
    }
    const linkedFile =
      this.get('mockBackend.entityRecords.file').findBy('entityId', linkedFileEntityId);
    return linkedFile ? recordToChildData(linkedFile) : null;
  },

  getMockChildrenData(dirEntityId) {
    const childrenDetailsCache = this.get('childrenDetailsCache');
    const mockEntityRecords = this.get('mockBackend.entityRecords');
    const allFiles = [
      ...get(mockEntityRecords, 'rootDir'),
      ...get(mockEntityRecords, 'dir'),
      ...get(mockEntityRecords, 'chainDir'),
      ...get(mockEntityRecords, 'file'),
    ];

    let cache = childrenDetailsCache[dirEntityId];
    if (!cache) {
      cache = this.getMockChildrenIds(dirEntityId).map(entityId => {
        const record = allFiles.findBy('entityId', entityId);
        if (record) {
          return recordToChildData(record);
        } else {
          return null;
        }
      });
    }
    return cache;
  },

  removeMockChild(dirEntityId, childEntityId) {
    const childrenDetailsCache = this.get('childrenDetailsCache');
    _.remove(childrenDetailsCache[dirEntityId], fileId => fileId.match(childEntityId));
  },
});

function hasManyEntityIds(record, relationName) {
  return record.hasMany(relationName).ids().map(gri => parseGri(gri).entityId);
}

function belongsToEntityId(record, relationName) {
  return parseGri(record.belongsTo(relationName).id()).entityId;
}

function recordToChildData(record) {
  return Object.assign(getProperties(
    record,
    'id',
    'index',
    'type',
    'size',
    'posixPermissions',
    'hasMetadata',
    'hasQos',
    'mtime',
    'activePermissionsType'
  ), {
    guid: get(record, 'entityId'),
    shares: hasManyEntityIds(record, 'shareRecords'),
    parentId: belongsToEntityId(record, 'parent'),
    ownerId: belongsToEntityId(record, 'owner'),
    providerId: belongsToEntityId(record, 'provider'),
  });
}
