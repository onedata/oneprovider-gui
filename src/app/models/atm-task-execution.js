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

export const entityType = 'op_atm_task_execution';
export const aspects = {
  openfaasFunctionPodStatusRegistry: 'openfaas_function_pod_status_registry',
  openfaasFunctionPodEventLog: 'openfaas_function_pod_event_log',
};

export default Model.extend(GraphSingleModelMixin, {
  /**
   * @type {ComputedProperty<string>}
   */
  schemaId: attr('string'),

  /**
   * @type {ComputedProperty<string>}
   */
  systemAuditLogId: attr('string'),

  /**
   * @type {ComputedProperty<string>}
   */
  timeSeriesStoreId: attr('string'),

  /**
   * @type {ComputedProperty<AtmTaskExecutionStatus>}
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
