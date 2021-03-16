/**
 * @module models/dataset
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

export const entityType = 'op_dataset';

export default Model.extend(GraphSingleModelMixin, {
  attached: attr('boolean'),

  /**
   * Id of file or directory being dataset root
   */
  rootFile: belongsTo('file'),

  /**
   * Possible values: 'metadata_protection', 'data_protection'
   */
  protectionFlags: attr('array'),
}).reopenClass(StaticGraphModelMixin);
