/**
 * Information about datasets for file. Similar to `file-qos-summary`.
 * This model is correlated to file - see `serializer:file` for method of fetching.
 * 
 * @module models/file-dataset-summary
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import { belongsTo, hasMany } from 'onedata-gui-websocket-client/utils/relationships';
import attr from 'ember-data/attr';

export default Model.extend(GraphSingleModelMixin, {
  /**
   * Dataset registered for this file, can be null if dataset is not esablished for file
   */
  directDataset: belongsTo('dataset'),

  /**
   * All datasets registered for this file and its ancestor directories
   */
  effectiveDatasets: hasMany('dataset'),

  /**
   * Same as `models/file#effProtectionFlags`
   */
  effectiveProtectionFlags: attr('array'),
}).reopenClass(StaticGraphModelMixin);
