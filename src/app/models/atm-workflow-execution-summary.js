/**
 * @module models/atm-workflow-execution-summary
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

export default Model.extend(GraphSingleModelMixin, {
  /**
   * @type {ComputedProperty<String>}
   */
  name: attr('string'),

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
   * @type {ComputedProperty<Models.AtmWorkflowExecution>}
   */
  atmWorkflowExecution: belongsTo('atm-workflow-execution'),

  /**
   * @type {ComputedProperty<Models.AtmInventory>}
   */
  atmInventory: belongsTo('atm-inventory'),
}).reopenClass(StaticGraphModelMixin);
