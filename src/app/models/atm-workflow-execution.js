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
   * @type {ComputedProperty<Models.AtmWorkflowSchemaSnapshot>}
   */
  atmWorkflowSchemaSnapshot: belongsTo('atm-workflow-schema-snapshot'),
}).reopenClass(StaticGraphModelMixin);
