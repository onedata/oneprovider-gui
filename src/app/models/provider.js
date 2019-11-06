/**
 * @module models/provider
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

export const entityType = 'op_provider';

export default Model.extend(GraphSingleModelMixin, {
  name: attr('string'),
  // FIXME: below properties must be implemented in backend
  latitude: attr('number'),
  longitude: attr('number'),
  online: attr('boolean'),
  spaceList: belongsTo('space-list'),
}).reopenClass(StaticGraphModelMixin);
