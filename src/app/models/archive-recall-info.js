/**
 * @module models/archive-recall-info
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

// model name differs from aspect name to avoid "s" on end of model name
export const aspect = 'archive_recall_details';

export default Model.extend(GraphSingleModelMixin, {
  archive: belongsTo('archive'),
  dataset: belongsTo('dataset'),
  totalFileCount: attr('number'),
  totalByteSize: attr('number'),
  startTime: attr('number'),
  finishTime: attr('number'),
}).reopenClass(StaticGraphModelMixin);
