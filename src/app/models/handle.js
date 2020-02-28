/**
 * @module models/handle
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

export const entityType = 'op_handle';

export default Model.extend(GraphSingleModelMixin, {
  url: attr('string'),
  metadataString: attr('string'),
}).reopenClass(StaticGraphModelMixin);
