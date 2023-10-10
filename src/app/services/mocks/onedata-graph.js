/**
 * Mock of Onedata Websocket WebSocket API - Graph level service for Oneprovider
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OnedataGraphMock, { messageNotSupported } from 'onedata-gui-websocket-client/services/mocks/onedata-graph';
import { get, getProperties, computed } from '@ember/object';
import _ from 'lodash';
import { next } from '@ember/runloop';
import {
  numberOfDirs,
  generateDirEntityId,
  parseDecodedDirEntityId,
  storageIdAlpha,
  storageIdBeta,
} from 'oneprovider-gui/services/mock-backend';
import { inject as service } from '@ember/service';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import { entityType as spaceEntityType } from 'oneprovider-gui/models/space';
import { entityType as transferEntityType } from 'oneprovider-gui/models/transfer';
import { entityType as datasetEntityType } from 'oneprovider-gui/models/dataset';
import { entityType as fileEntityType } from 'oneprovider-gui/models/file';
import { entityType as archiveEntityType } from 'oneprovider-gui/models/archive';
import { entityType as atmTaskExecutionEntityType } from 'oneprovider-gui/models/atm-task-execution';
import { entityType as qosRequirementEntityType } from 'oneprovider-gui/models/qos-requirement';
import { EntrySeverity } from 'onedata-gui-common/utils/audit-log';
import atmWorkflowExecutionSummaryIndex from 'oneprovider-gui/utils/atm-workflow-execution-summary-index';

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
  available_qos_parameters(operation) {
    if (operation !== 'get') {
      return messageNotSupported;
    }
    return {
      qosParameters: this.get('qosParameters'),
    };
  },
  evaluate_qos_expression(operation, entityId, data) {
    if (operation !== 'create') {
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
  datasets_details(operation, entityId, { state, index, limit, offset }) {
    if (operation !== 'get') {
      return messageNotSupported;
    }
    const rootDatasetsData = this.get('mockBackend.entityRecords.dataset')
      .map(ds => datasetRecordToChildData(ds))
      .filterBy('parent', null)
      .filterBy('state', state);
    let startFromIndex = index ?
      rootDatasetsData.findIndex(r => get(r, 'index') === index) : 0;
    if (startFromIndex === -1) {
      startFromIndex = 0;
    }
    const effOffset = offset || 0;
    const end = startFromIndex + limit + effOffset;
    return {
      datasets: rootDatasetsData.slice(
        startFromIndex + effOffset,
        end,
      ),
      isLast: end >= rootDatasetsData.length,
    };
  },
  atm_workflow_execution_summaries(operation, entityId, data) {
    if (operation !== 'get') {
      return messageNotSupported;
    }
    const allAtmWorkflowExecutionSummaries =
      this.get('mockBackend.allAtmWorkflowExecutionSummaries');
    const {
      phase,
      offset,
      index,
      limit,
    } = data;
    let startPosition = 0;
    if (index) {
      const itemPositionByIndex = allAtmWorkflowExecutionSummaries[phase]
        .findIndex(item =>
          atmWorkflowExecutionSummaryIndex(item, phase) === index
        );
      if (itemPositionByIndex !== -1) {
        startPosition = itemPositionByIndex;
      }
    }
    if (offset > 0) {
      startPosition += offset;
    }
    const atmWorkflowExecutionSummaries = allAtmWorkflowExecutionSummaries[phase]
      .slice(startPosition, startPosition + limit);

    return {
      list: atmWorkflowExecutionSummaries.map(atmWorkflowExecutionSummary =>
        atmWorkflowExecutionSummaryToAttrsData(atmWorkflowExecutionSummary)
      ),
      isLast: atmWorkflowExecutionSummaries.length < limit,
    };
  },
  dir_stats_service_state(operation) {
    if (operation !== 'get') {
      return messageNotSupported;
    }
    return {
      status: 'enabled',
      since: Math.floor(Date.now() / 1000) - 3600,
    };
  },
};

const datasetHandlers = {
  children_details(operation, entityId, { state, index, limit, offset }) {
    if (operation !== 'get') {
      return messageNotSupported;
    }
    const childrenDatasetsData = this.get('mockBackend.entityRecords.dataset')
      .map(ds => datasetRecordToChildData(ds))
      .filterBy('state', state)
      .filter(ds => {
        const parent = get(ds, 'parent');
        return parent && parseGri(get(ds, 'parent')).entityId === entityId;
      });
    let startFromIndex = index ?
      childrenDatasetsData.findIndex(r => get(r, 'index') === index) : 0;
    if (startFromIndex === -1) {
      startFromIndex = 0;
    }
    const effOffset = offset || 0;
    const end = startFromIndex + limit + effOffset;
    return {
      datasets: childrenDatasetsData.slice(
        startFromIndex + effOffset,
        end,
      ),
      isLast: end >= childrenDatasetsData.length,
    };
  },
  archives_details(operation, entityId, { index, limit, offset }) {
    if (operation !== 'get') {
      return messageNotSupported;
    }
    if (_.isEmpty(this.mockBackend?.entityRecords)) {
      return {
        success: false,
        error: {
          id: 'internalServerError',
          message: 'Mock backend not initialized or not available',
        },
        data: {},
      };
    }
    const childrenArchivesData = this.get('mockBackend.entityRecords.archive')
      .map(arch => archiveRecordToChildData(arch))
      .filter(arch => {
        const dataset = get(arch, 'dataset');
        return dataset && parseGri(dataset).entityId === entityId;
      });
    let startFromIndex = index ?
      childrenArchivesData.findIndex(r => get(r, 'index') === index) : 0;
    if (startFromIndex === -1) {
      startFromIndex = 0;
    }
    const effOffset = offset || 0;
    const end = startFromIndex + limit + effOffset;
    return {
      archives: childrenArchivesData.slice(
        startFromIndex + effOffset,
        end,
      ),
      isLast: end >= childrenArchivesData.length,
    };
  },
};

const archiveHandlers = {
  delete(operation, entityId) {
    if (operation !== 'create') {
      return messageNotSupported;
    }
    const archives = this.get('mockBackend.entityRecords.archive');
    const archive = archives.findBy('entityId', entityId);
    if (!archive) {
      return messageNotFound;
    }
    archive.set('state', 'deleting');
    // it's because we don't support async mock handlers, and saving in the same runloop
    // causes collision with record reload()
    next(() => archive.save());
    return {};
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
      processedFiles: 20,
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
  hardlinks(operation, entityId, data, authHint, aspectId) {
    switch (operation) {
      case 'get':
        if (aspectId) {
          return {};
        } else {
          return {
            hardlinks: this.getHardlinks(entityId),
          };
        }
      default:
        return messageNotSupported;
    }
  },
  symlink_target(operation, entityId) {
    let target;
    switch (operation) {
      case 'get':
        target = this.getSymlinkTargetFile(entityId);
        return target || {
          success: false,
          error: { id: 'posix', details: { errno: 'enoent' } },
          data: {},
        };
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

const atmStoreHandlers = {
  content(operation, entityId, data) {
    if (operation !== 'get') {
      return messageNotSupported;
    }

    const maxEntriesCount = 200;
    const {
      type,
      index = 0,
      offset = 0,
      limit = 1,
    } = data.options;
    const startPosition = Math.min(
      Math.max((Number(index) || 0) + offset, 0),
      maxEntriesCount
    );
    const endPositon = Math.min(startPosition + limit, maxEntriesCount - 1);
    const storeEntries = [];
    const entryGeneratorFunc = entityId.startsWith('auditLog') ?
      generateStoreAuditLogContentEntry : generateStoreContentEntry;

    for (let i = startPosition; i <= endPositon; i++) {
      storeEntries.push(entryGeneratorFunc(i));
    }

    const storeType = type.slice(0, type.indexOf('StoreContentBrowseOptions'));
    const isLast = endPositon >= maxEntriesCount - 1;
    if (storeType === 'list' || storeType === 'treeForest') {
      return {
        items: storeEntries,
        isLast,
      };
    } else if (storeType === 'exception') {
      return {
        items: storeEntries.map(({ value, ...rest }) => ({
          ...rest,
          value: {
            traceId: '123456',
            value,
          },
        })),
        isLast,
      };
    } else if (storeType === 'auditLog') {
      return {
        logEntries: storeEntries,
        isLast,
      };
    } else if (storeType === 'singleValue') {
      return storeEntries[0];
    }
  },
};

const atmTaskExecutionHandlers = {
  openfaas_function_pod_event_log(operation, entityId, data, authHint, aspectId) {
    if (operation !== 'get' || !aspectId) {
      return messageNotSupported;
    }
    return generateAuditLogEntries('openfaasActivity', data, { podId: aspectId });
  },
};

const qosTimeSeriesMetricSeconds = {
  minute: 60,
  hour: 60 * 60,
  day: 24 * 60 * 60,
  month: 30 * 24 * 60 * 60,
};

const qosRequirementHandlers = {
  transfer_stats_collection_schema(operation, entityId, data, authHint, aspectId) {
    if (operation !== 'get') {
      return messageNotSupported;
    }

    const metrics = {
      minute: {
        aggregator: 'sum',
        resolution: 60,
      },
      hour: {
        aggregator: 'sum',
        resolution: 60 * 60,
      },
      day: {
        aggregator: 'sum',
        resolution: 60 * 60 * 24,
      },
      month: {
        aggregator: 'sum',
        resolution: 60 * 60 * 24 * 30,
      },
    };
    const timeSeriesSchemas = [{
      nameGeneratorType: 'addPrefix',
      nameGenerator: 'st_',
      metrics,
    }];
    if (aspectId === 'bytes') {
      timeSeriesSchemas.push({
        nameGeneratorType: 'exact',
        nameGenerator: 'total',
        metrics,
      });
    }

    return { timeSeriesSchemas };
  },
  transfer_stats_collection(operation, entityId, data, authHint, aspectId) {
    if (operation !== 'get') {
      return messageNotSupported;
    }

    switch (data?.mode) {
      case 'layout': {
        const storageId = this.mockBackend.entityRecords.storage[0].entityId;
        const layout = {
          [`st_${storageId}`]: ['minute', 'hour', 'day', 'month'],
        };
        if (aspectId === 'bytes') {
          layout.total = ['minute', 'hour', 'day', 'month'];
        }
        return { layout };
      }
      case 'slice': {
        const {
          windowLimit,
          startTimestamp,
          layout,
        } = data;
        const slice = {};
        for (const seriesName in layout) {
          const metricsNames = layout[seriesName];
          const seriesResult = {};
          slice[seriesName] = seriesResult;
          for (const metricName of metricsNames) {
            const metricSeconds = qosTimeSeriesMetricSeconds[metricName];
            const lastPointTimestamp = startTimestamp - (startTimestamp % metricSeconds);
            seriesResult[metricName] = [];
            for (let i = 0; i < windowLimit - 1; i++) {
              const pointTimestamp = lastPointTimestamp - i * metricSeconds;
              seriesResult[metricName].push({
                timestamp: lastPointTimestamp - i * metricSeconds,
                value: pointTimestamp % 1024,
              });
            }
          }
        }
        return { slice };
      }
      default:
        return messageNotSupported;
    }
  },
  audit_log(operation, entityId, data) {
    if (operation !== 'get') {
      return messageNotSupported;
    }

    const {
      index,
    } = data;

    const file = this.get('mockBackend.entityRecords.file.0');
    const fileId = get(file, 'cdmiObjectId');

    if (index !== null) {
      return {
        logEntries: [],
        isLast: true,
      };
    }

    const errorMessage = {
      timestamp: 1655137705932,
      index: '3',
      severity: 'error',
      source: 'system',
      content: {
        status: 'failed',
        fileId,
        description: 'Failed to reconcile local replica: no space left on device.',
        reason: {
          id: 'posix',
          details: {
            errno: 'enospc',
          },
        },
      },
    };

    const result = {
      logEntries: [{
        timestamp: 1655137705791,
        index: '0',
        severity: 'info',
        source: 'system',
        content: {
          status: 'scheduled',
          description: 'Remote replica differs, reconciliation started.',
          fileId,
        },
      }, {
        timestamp: 1655137705818,
        index: '1',
        severity: 'info',
        source: 'system',
        content: {
          status: 'skipped',
          description: 'Remote replica differs, reconciliation already in progress.',
          fileId,
        },
      }, {
        timestamp: 1655137705818,
        index: '1b',
        severity: 'info',
        source: 'system',
        content: {
          status: 'skipped',
          description: 'Remote replica differs, ignoring since the file has been deleted locally.',
          fileId,
        },
      }, {
        timestamp: 1655137705932,
        index: '2',
        severity: 'info',
        source: 'system',
        content: {
          status: 'completed',
          description: 'Local replica reconciled.',
          fileId,
        },
      }],
      isLast: true,
    };
    for (let i = 0; i < 25; ++i) {
      result.logEntries.push(Object.assign({}, errorMessage, {
        index: String(Number(errorMessage.index) + i),
      }));
    }
    return result;
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

  childrenIdsCache: undefined,
  childrenDetailsCache: undefined,

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
    this.clearChildrenCache();
    const _handlers = Object.freeze({
      [spaceEntityType]: spaceHandlers,
      [transferEntityType]: transferHandlers,
      [fileEntityType]: fileHandlers,
      [datasetEntityType]: datasetHandlers,
      [archiveEntityType]: archiveHandlers,
      // Using entity type string directly, because op_atm_store does not have
      // dedicated model in ember data.
      op_atm_store: atmStoreHandlers,
      [atmTaskExecutionEntityType]: atmTaskExecutionHandlers,
      [qosRequirementEntityType]: qosRequirementHandlers,
    });
    this.set(
      'handlers',
      _.merge({}, this.get('handlers'), _handlers)
    );
  },

  clearChildrenCache() {
    this.setProperties({
      childrenIdsCache: {},
      childrenDetailsCache: {},
    });
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
        const childId = get(fileData, 'fileId');
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
    return mockChildren.slice(
      Math.max(arrIndex + offset, 0),
      Math.max(arrIndex + offset + limit, 0)
    );
  },

  getMockChildrenIds(dirId) {
    const childrenIdsCache = this.get('childrenIdsCache');
    const decodedDirEntityId = atob(dirId);
    if (childrenIdsCache[dirId]) {
      return childrenIdsCache[dirId];
    } else {
      let cache;
      if (/.*#archive-dir-.*/.test(decodedDirEntityId)) {
        cache = [
          decodedDirEntityId.match(/.*file-(.*)#.*/)[1],
        ];
      } else if (/.*#-dir-0000.*/.test(decodedDirEntityId)) {
        // root dir
        cache = [
          ..._.range(numberOfDirs).map(i =>
            generateDirEntityId(i, dirId)
          ),
          ...this.get('mockBackend.entityRecords.file').mapBy('entityId'),
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

  getSymlinkTargetFile(symlinkEntityId) {
    const targetFileEntityId = this.get('mockBackend.symlinkMap')[symlinkEntityId];
    if (!targetFileEntityId) {
      return null;
    }
    const entityRecords = this.get('mockBackend.entityRecords');
    const potentialTargets = [
      ...entityRecords.file,
      ...entityRecords.dir,
    ];
    const targetFile = potentialTargets.findBy('entityId', targetFileEntityId);
    return targetFile ? recordToChildData(targetFile) : null;
  },

  getHardlinks(fileEntityId) {
    const files = this.get('mockBackend.entityRecords.file');
    const originalFile = files.findBy('entityId', fileEntityId);
    const hardlinks = [originalFile];
    if (get(originalFile, 'hardlinkCount') > 1) {
      hardlinks.push(files.without(originalFile).findBy('hardlinkCount', 2));
    }
    return hardlinks.compact().mapBy('id');
  },

  getMockChildrenData(dirEntityId) {
    const childrenDetailsCache = this.get('childrenDetailsCache');
    const mockEntityRecords = this.get('mockBackend.entityRecords');
    const allFiles = [
      ...get(mockEntityRecords, 'rootDir'),
      ...get(mockEntityRecords, 'dir'),
      ...get(mockEntityRecords, 'chainDir'),
      ...get(mockEntityRecords, 'file'),
      ...get(mockEntityRecords, 'archiveDir'),
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
    'hasCustomMetadata',
    'effQosMembership',
    'effDatasetMembership',
    'effProtectionFlags',
    'mtime',
    'activePermissionsType'
  ), {
    fileId: get(record, 'entityId'),
    directShareIds: hasManyEntityIds(record, 'shareRecords'),
    parentFileId: belongsToEntityId(record, 'parent'),
    ownerUserId: belongsToEntityId(record, 'owner'),
    originProviderId: belongsToEntityId(record, 'provider'),
  });
}

function datasetRecordToChildData(record) {
  return Object.assign(getProperties(
    record,
    'id',
    'index',
    'state',
    'protectionFlags',
    'effProtectionFlags',
    'creationTime',
    'rootFilePath',
    'rootFileType',
  ), {
    parent: record.belongsTo('parent').id(),
    rootFile: record.belongsTo('rootFile').id(),
  });
}

function archiveRecordToChildData(record) {
  return Object.assign(getProperties(
    record,
    'id',
    'index',
    'state',
    'creationTime',
    'config',
    'description',
    'preservedCallback',
    'deletedCallback',
  ), {
    dataset: record.belongsTo('dataset').id(),
    rootDir: record.belongsTo('rootDir').id(),
  });
}

function atmWorkflowExecutionSummaryToAttrsData(record) {
  return Object.assign(getProperties(
    record,
    'id',
    'name',
    'status',
    'scheduleTime',
    'startTime',
    'finishTime'
  ), {
    atmWorkflowExecution: record.belongsTo('atmWorkflowExecution').id(),
  });
}

function generateStoreAuditLogContentEntry(index) {
  const startTimestamp = 1658912037;
  const allSeverities = Object.values(EntrySeverity);
  const isUserLog = index % 10 === 0;
  const isUserNoDescriptionLog = index % 20 === 0;

  const content = {};
  if (isUserLog) {
    if (!isUserNoDescriptionLog) {
      content.description = `My custom log description ${index}`;
    }
    content.field1 = 'aaaaaaaa';
    content.field2 = ['bbbbb', { c: 'ddddddd' }];
  } else {
    content.description = `System log ${index}`;
  }

  return {
    index: String(index),
    timestamp: (startTimestamp - index) * 1000 + 123,
    severity: allSeverities[index % allSeverities.length],
    source: isUserLog ? 'user' : 'system',
    content,
  };
}

function generateStoreContentEntry(index) {
  const valueKeys = _.range(Math.ceil((index + 1) / 10))
    .map(j => `key${j}`);
  const value = valueKeys.reduce((obj, key) => {
    obj[key] = 123;
    return obj;
  }, {});

  const success = index % 10 !== 5;
  return {
    index: String(index),
    success,
    value: value,
    error: success ? undefined : { id: 'forbidden' },
  };
}

function generateAuditLogEntries(type, pagingParams, extraData = {}) {
  const firstEntryDate = new Date();
  firstEntryDate.setMinutes(0, 0, 0);
  const firstEntryTimestamp = Math.floor(firstEntryDate.valueOf() / 1000) - 3600;
  const {
    index,
    offset,
    limit,
  } = pagingParams;
  const startPosition = Math.max((Number(index) || 0) + offset, 0);
  const startTimestampOffset = startPosition * 10;
  const startEntryTimestamp = firstEntryTimestamp + startTimestampOffset;
  const nowTimestamp = Math.floor(new Date().valueOf() / 1000);
  const entries = [];
  let entryIdx = startPosition;
  for (
    let i = startEntryTimestamp; i <= nowTimestamp && entries.length < limit; i += 10
  ) {
    entries.push(generateAuditLogEntry({
      index: String(entryIdx),
      timestamp: i,
      type,
      extraData,
    }));
    entryIdx++;
  }

  return {
    logEntries: entries,
    isLast: entries.length < limit,
  };
}

function generateAuditLogEntry({ index, timestamp, type, extraData }) {
  const entry = {
    index,
    // infinite log timestamps are in milliseconds
    timestamp: timestamp * 1000,
    severity: 'info',
    source: 'system',
  };
  if (type === 'openfaasActivity') {
    const podId = extraData && extraData.podId;
    if (!podId) {
      throw new Error('Pod ID not specified!');
    }
    entry.content = {
      type: 'Normal',
      reason: 'Completed',
      message: `Message of event at ${timestamp} (${podId}) (index: #${index})`,
    };
  }
  return entry;
}
