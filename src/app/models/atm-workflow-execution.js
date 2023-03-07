/**
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

export const entityType = 'op_atm_workflow_execution';

export default Model.extend(GraphSingleModelMixin, {
  /**
   * @type {ComputedProperty<AtmWorkflowExecutionStatus>}
   */
  status: attr('string'),

  /**
   * @type {ComputedProperty<number>}
   */
  scheduleTime: attr('number'),

  /**
   * @type {ComputedProperty<number>}
   */
  startTime: attr('number'),

  /**
   * @type {ComputedProperty<number>}
   */
  suspendTime: attr('number'),

  /**
   * @type {ComputedProperty<number>}
   */
  finishTime: attr('number'),

  /**
   * Mapping: `{ lambdaId -> lambdaSnapshotId }`
   * @type {ComputedProperty<Object>}
   */
  lambdaSnapshotRegistry: attr('object'),

  /**
   * Mapping: `{ storeSchemaId -> storeId }`
   * @type {ComputedProperty<Object>}
   */
  storeRegistry: attr('object'),

  /**
   * @type {ComputedProperty<string>}
   */
  systemAuditLogId: attr('string'),

  /**
   * Array of objects:
   * ```
   * {
   *   schemaId: String, // lane schema id,
   *   runs: [
   *     {
   *       status: String,
   *       runNumber: Number|null, // null means run prepared in advance
   *       originRunNumber: Number|null,
   *       runType: String, // `'regular'` | `'rerun'` | `'retry'`
   *       iteratedStoreId: String,
   *       exceptionStoreId: String|null,
   *       isRetriable: Boolean,
   *       isRerunable: Boolean,
   *       parallelBoxes: [
   *         {
   *           schemaId: String, // parallel box schema id,
   *           status: String,
   *           taskRegistry: Object // Mapping: `{ taskSchemaId -> taskId }`
   *         },
   *         { ... },
   *         ...
   *       ]
   *     },
   *     { ... },
   *     ...
   *   ]
   * }
   * ```
   * @type {ComputedProperty<Array<Object>>}
   */
  lanes: attr('array'),

  /**
   * @type {ComputedProperty<Models.AtmWorkflowSchemaSnapshot>}
   */
  atmWorkflowSchemaSnapshot: belongsTo('atm-workflow-schema-snapshot'),

  /**
   * @type {ComputedProperty<Models.AtmInventory>}
   */
  atmInventory: belongsTo('atm-inventory'),

  /**
   * @type {ComputedProperty<Models.Space>}
   */
  space: belongsTo('space'),
}).reopenClass(StaticGraphModelMixin);
