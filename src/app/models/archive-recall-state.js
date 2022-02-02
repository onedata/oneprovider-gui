/**
 * @module models/archive-recall-state
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

// model name differs from aspect name to avoid "s" on end of model name
export const aspect = 'archive_recall_progress';

export default Model.extend(GraphSingleModelMixin, {
  bytesCopied: attr('number'),
  filesCopied: attr('number'),
  filesFailed: attr('number'),

  /**
   * @type {ComputedProperty<{ fileId: String, reason: Object }>}
   */
  lastError: attr('object', { defaultValue: null }),
}).reopenClass(StaticGraphModelMixin);
