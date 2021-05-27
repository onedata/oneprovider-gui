/**
 * @module models/archive
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

export const entityType = 'op_archive';

export default Model.extend(GraphSingleModelMixin, {
  index: attr('string'),

  /**
   * One of: pending, building, preserved, failed, purging
   * @type {String}
   */
  state: attr('string'),

  /**
   * Format: UNIX timestamp
   * @type {Number}
   */
  creationTime: attr('number'),

  /**
   * Object params:
   * - `incremental: Boolean`
   * - `layout: String`, one of: `bagit`, `plain`
   * - `includeDip: Boolean` - if true dissemination information package (DIP) is created
   *      alongside with archival information package (AIP), on the storage
   * @type {Object}
   */
  config: attr('object'),

  description: attr('string'),

  /**
   * URL to which POST will be made by backend when archive changes it's state to
   * `preserved`.
   * @type {String}
   */
  preservedCallback: attr('string'),

  /**
   * URL to which POST will be made by backend when archive finish purging
   * @type {String}
   */
  purgedCallback: attr('string'),

  /**
   * Object params:
   * - `filesArchived: Number`
   * - `sizeArchived: Boolean`
   * - `filesFailed: Number`
   * @type {Object}
   */
  stats: attr('object', { defaultValue: () => {} }),

  dataset: belongsTo('dataset'),
  parentDir: belongsTo('file'),
}).reopenClass(StaticGraphModelMixin);
