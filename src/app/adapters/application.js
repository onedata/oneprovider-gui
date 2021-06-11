import OnedataAdapter from 'onedata-gui-websocket-client/adapters/application';
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
]));

export default OnedataAdapter.extend({
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
