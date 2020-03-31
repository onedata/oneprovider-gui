/**
 * @module models/qos
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
  fulfilled: attr('boolean'),
  replicasNum: attr('number'),
  expression: attr('string'),

  file: belongsTo('file'),
}).reopenClass(StaticGraphModelMixin);
