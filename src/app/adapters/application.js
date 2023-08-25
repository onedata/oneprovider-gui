import OneproviderWebsocketAdapter from 'oneprovider-gui/adapters/onedata-websocket';
import LocalStorageAdapter from 'onedata-gui-websocket-client/adapters/local-storage';
import config from 'ember-get-config';
import { environmentExport } from 'onedata-gui-websocket-client/utils/development-environment';
import { entityType as userEntityType } from 'oneprovider-gui/models/user';
import { entityType as groupEntityType } from 'oneprovider-gui/models/group';
import { entityType as spaceEntityType } from 'oneprovider-gui/models/space';
import { entityType as transferEntityType } from 'oneprovider-gui/models/transfer';
import { entityType as handleEntityType } from 'oneprovider-gui/models/handle';
import { entityType as shareEntityType } from 'oneprovider-gui/models/share';
import { entityType as qosEntityType } from 'oneprovider-gui/models/qos-requirement';
import { entityType as datasetEntityType } from 'oneprovider-gui/models/dataset';
import { entityType as archiveEntityType } from 'oneprovider-gui/models/archive';
import { entityType as atmInventoryEntityType } from 'oneprovider-gui/models/atm-inventory';
import { entityType as atmWorkflowSchemaEntityType } from 'oneprovider-gui/models/atm-workflow-schema';
import { entityType as atmWorkflowExecutionEntityType } from 'oneprovider-gui/models/atm-workflow-execution';
import { entityType as atmWorkflowSchemaSnapshotEntityType } from 'oneprovider-gui/models/atm-workflow-schema-snapshot';
import { entityType as atmTaskExecutionEntityType } from 'oneprovider-gui/models/atm-task-execution';
import { entityType as storageEntityType } from 'oneprovider-gui/models/storage';

const BaseAdapter = environmentExport(
  config,
  OneproviderWebsocketAdapter,
  LocalStorageAdapter
);

export const entityTypeToEmberModelNameMap = Object.freeze(new Map([
  [groupEntityType, 'group'],
  [spaceEntityType, 'space'],
  [transferEntityType, 'transfer'],
  [userEntityType, 'user'],
  [handleEntityType, 'handle'],
  [shareEntityType, 'share'],
  [qosEntityType, 'qos-requirement'],
  [datasetEntityType, 'dataset'],
  [archiveEntityType, 'archive'],
  [atmInventoryEntityType, 'atm-inventory'],
  [atmWorkflowSchemaEntityType, 'atm-workflow-schema'],
  [atmWorkflowExecutionEntityType, 'atm-workflow-execution'],
  [atmWorkflowSchemaSnapshotEntityType, 'atm-workflow-schema-snapshot'],
  [atmTaskExecutionEntityType, 'atm-task-execution'],
  [storageEntityType, 'storage'],
]));

export default BaseAdapter.extend({
  /**
   * @override
   */
  subscribe: false,

  /**
   * @override
   */
  createScope: 'private',

  /**
   * @override
   */
  entityTypeToEmberModelNameMap,
});
