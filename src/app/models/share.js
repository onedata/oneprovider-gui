/**
 * @module models/share
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

export const entityType = 'op_share';

export default Model.extend(GraphSingleModelMixin, {
  name: attr('string'),
  publicUrl: attr('string'),
  fileType: attr('string'),
  handle: belongsTo('handle'),

  rootFile: belongsTo('file'),
  privateRootFile: belongsTo('file'),
}).reopenClass(StaticGraphModelMixin);
