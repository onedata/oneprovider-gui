/**
 * @module models/atm-workflow-schema-snapshot
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

export const entityType = 'op_atm_workflow_schema_snapshot';

export default Model.extend(GraphSingleModelMixin, {
  /**
   * @type {ComputedProperty<String>}
   */
  name: attr('string'),

  /**
   * @type {ComputedProperty<String>}
   */
  summary: attr('string'),

  /**
   * Contains mapping (revisionNumber: String) -> AtmWorkflowSchemaRevision
   * It should contain only one revision - the one used during workflow execution.
   * @type {ComputedProperty<Object>}
   */
  revisionRegistry: attr('object'),

  /**
   * @type {ComputedProperty<Models.AtmInventory>}
   */
  atmInventory: belongsTo('atm-inventory'),
}).reopenClass(StaticGraphModelMixin);
