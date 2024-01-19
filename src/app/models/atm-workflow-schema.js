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

export const entityType = 'op_atm_workflow_schema';

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
   * Contains mapping (revisionNumber: String) -> AtmWorkflowSchemaRevision.
   * For more information about AtmWorkflowSchemaRevision type look at the
   * atm-workflow-schema model documentation in onezone-gui project.
   * @type {ComputedProperty<Object>}
   */
  revisionRegistry: attr('object'),

  /**
   * If false, then this particular workflow schema is not compatible with
   * current Oneprovider. The most probable reason is that the schema is too
   * new for API of current legacy Oneprovider.
   * @type {ComputedProperty<boolean>}
   */
  isCompatible: attr('boolean'),

  /**
   * @type {ComputedProperty<Models.AtmInventory>}
   */
  atmInventory: belongsTo('atm-inventory'),
}).reopenClass(StaticGraphModelMixin);
