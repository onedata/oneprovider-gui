/**
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

export default Model.extend(GraphSingleModelMixin, {
  timestamp: attr('number'),

  /**
   * Provider EntityId => Array of throughput values (b/s)
   */
  chartsIn: attr('object'),

  /**
   * Provider EntityId => Array of throughput values (b/s)
   */
  chartsOut: attr('object'),
}).reopenClass(StaticGraphModelMixin);
