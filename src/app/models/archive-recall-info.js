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

export const aspect = 'archive_recall_details';

export default Model.extend(GraphSingleModelMixin, {
  sourceArchive: belongsTo('archive'),
  sourceDataset: belongsTo('dataset'),
  targetFiles: attr('number'),
  targetBytes: attr('number'),
  startTimestamp: attr('number'),
  finishTimestamp: attr('number'),
}).reopenClass(StaticGraphModelMixin);
