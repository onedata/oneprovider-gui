/**
 * @module models/atm-workflow-schema
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
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
}).reopenClass(StaticGraphModelMixin);
