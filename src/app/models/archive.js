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
import { computed } from '@ember/object';

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
   * - `createNestedArchives: Boolean`
   * - `incremental: Boolean`
   * - `baseArchiveId: String` if `incremental` is true, you can provide archive ID
   *      from which incrementation will be computed; by default it is latest archive
   *      in this dataset
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
   * - `bytesArchived: Boolean`
   * - `filesFailed: Number`
   * @type {Object}
   */
  stats: attr('object', { defaultValue: () => {} }),

  /**
   * Relation to archive from which the incremental archive is created.
   * This relation is typically non-empty if `config.incremental` is true.
   * Exception is when the very first archive is incremental (there is no other archive
   * to be base).
   * @type { ComputedProperty < Models.Archive > }
   */
  baseArchive: belongsTo('archive'),

  /**
   * Used in AIP archives only if the archive includes DIP.
   * This relation should be non-empty if `config.includeDip` is true.
   * @type {ComputedProperty<Models.Archive>}
   */
  relatedDip: belongsTo('archive'),

  /**
   * Used only in DIP archives - reference to related AIP archive.
   * Non-empty relation means that this is DIP archive.
   * @type {ComputedProperty<Models.Archive>}
   */
  relatedAip: belongsTo('archive'),

  dataset: belongsTo('dataset'),
  rootDir: belongsTo('file'),
}).reopenClass(StaticGraphModelMixin);
