/**
 * @module models/transfer-progress
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

export default Model.extend(GraphSingleModelMixin, {
  timestamp: attr('number'),
  replicatedBytes: attr('number'),
  replicatedFiles: attr('number'),
  evictedFiles: attr('number'),

  /**
   * One of:
   * - scheduled
   * - replicating
   * - evicting
   * - aborting
   * - skipped
   * - completed
   * - cancelled
   * - failed
   */
  status: attr('string'),
}).reopenClass(StaticGraphModelMixin);
