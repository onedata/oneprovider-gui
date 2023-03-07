/**
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';

export const entityType = 'op_qos';

export default Model.extend(GraphSingleModelMixin, {
  /**
   * One of: impossible, pending, fulfilled
   * @type {ComputedProperty<String>}
   */
  status: attr('string'),

  replicasNum: attr('number'),
  expressionRpn: attr('array'),

  file: belongsTo('file'),
}).reopenClass(StaticGraphModelMixin);
