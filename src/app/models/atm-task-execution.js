/**
 * @module models/atm-task-execution
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

export const entityType = 'op_atm_task_execution';

export default Model.extend(GraphSingleModelMixin, {
  /**
   * @type {ComputedProperty<String>}
   */
  schemaId: attr('string'),

  /**
   * One of:
   * - `'pending'`,
   * - `'active'`,
   * - `'finished'`,
   * - `'failed'`.
   * @type {ComputedProperty<String>}
   */
  status: attr('string'),

  /**
   * @type {ComputedProperty<Number>}
   */
  itemsInProcessing: attr('number'),

  /**
   * @type {ComputedProperty<Number>}
   */
  itemsProcessed: attr('number'),

  /**
   * @type {ComputedProperty<Number>}
   */
  itemsFailed: attr('number'),

  /**
   * @type {ComputedProperty<Models.AtmWorkflowExecution>}
   */
  atmWorkflowExecution: belongsTo('atm-workflow-execution'),
}).reopenClass(StaticGraphModelMixin);
