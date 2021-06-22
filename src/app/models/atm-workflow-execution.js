/**
 * @module models/atm-workflow-execution
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
   * One of:
   * - `'scheduled'`,
   * - `'preparing'`,
   * - `'enqueued'`,
   * - `'active'`,
   * - `'finished'`,
   * - `'failed'`.
   * @type {ComputedProperty<String>}
   */
  status: attr('string'),

  /**
   * @type {ComputedProperty<Number>}
   */
  scheduleTime: attr('number'),

  /**
   * @type {ComputedProperty<Number>}
   */
  startTime: attr('number'),

  /**
   * @type {ComputedProperty<Number>}
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
   * Array of objects:
   * ```
   * {
   *   schemaId: String, // lane schema id,
   *   status: String, // for possible values see `status` field in `atmTaskExecution` model
   *   parallelBoxes: [
   *     {
   *       schemaId: String, // lane schema id,
   *       status: String, // for possible values see `status` field in
   *         // `atmTaskExecution` model
   *       taskRegistry: Object // Mapping: `{ taskSchemaId -> taskId }`
   *     },
   *     { ... },
   *     ...
   *  ]
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
