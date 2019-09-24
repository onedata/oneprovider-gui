/**
 * @module models/transfer
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

export default Model.extend(GraphSingleModelMixin, {
  /**
   * Destination of this transfer
   * @type {Models.Oneprovider}
   */
  replicatingOneprovider: belongsTo('oneprovider'),

  /**
   * Oneprovider that will evict the file after this transfer
   * @type {Models.Oneprovider}
   */
  evictingOneprovider: belongsTo('oneprovider'),
}).reopenClass(StaticGraphModelMixin);
