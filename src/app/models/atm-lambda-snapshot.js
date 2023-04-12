/**
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

export const entityType = 'op_atm_lambda_snapshot';

export default Model.extend(GraphSingleModelMixin, {
  /**
   * Contains mapping (revisionNumber: String) -> AtmLambdaRevision
   * @type {ComputedProperty<Object>}
   */
  revisionRegistry: attr('object'),
}).reopenClass(StaticGraphModelMixin);
