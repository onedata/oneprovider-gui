/**
 * @author Michał Borzęcki
 * @copyright (C) 2019-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';

export const entityType = 'op_group';

export default Model.extend(GraphSingleModelMixin, {
  name: attr('string'),

  /**
   * @type {GroupType}
   */
  type: attr('string'),

  effUserList: belongsTo('user-list'),
}).reopenClass(StaticGraphModelMixin);
