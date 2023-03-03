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

export const entityType = 'op_atm_store';

export default Model.extend(GraphSingleModelMixin, {
  /**
   * @type {ComputedProperty<String>}
   */
  schemaId: attr('string'),

  /**
   * @type {ComputedProperty<any>}
   */
  initialContent: attr(),

  /**
   * True, when store cannot be modified (which means, that it will not accept
   * any new data).
   * @type {ComputedProperty<any>}
   */
  frozen: attr('boolean'),

  /**
   * @type {ComputedProperty<String>}
   */
  type: attr('string'),

  /**
   * @type {ComputedProperty<Object>}
   */
  config: attr('object'),

  /**
   * @type {ComputedProperty<Models.AtmWorkflowExecution>}
   */
  atmWorkflowExecution: belongsTo('atm-workflow-execution'),
}).reopenClass(StaticGraphModelMixin);
