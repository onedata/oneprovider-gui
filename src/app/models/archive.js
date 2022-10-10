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

/**
 * @type {Array<ArchiveState>}
 */
export const validArchiveStates = Object.freeze([
  'pending',
  'building',
  'verifying',
  'cancelling',
  'preserved',
  'cancelled',
  'verification_failed',
  'failed',
  'deleting',
]);

/**
 * @typedef {'pending'|'building'|'verifying'|'cancelling'|'preserved'|'cancelled'|'verification_failed'|'failed'|'deleting'} ArchiveState
 */

/**
 * @typedef {'creating'|'succeeded'|'cancelled'|'failed'|'destroying'} ArchiveMetaState
 */

export default Model.extend(GraphSingleModelMixin, {
  index: attr('string'),

  /**
   * @type {ArchiveState}
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
   * - `incremental: Object`
   *    - `enabled: Boolean` set this flag to true to create incremental archive
   *    - `[basedOn: String]` **only when creating:** you can provide archive ID from
   *       which incrementation will be computed; by default it is latest archive in this
   *       dataset
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
   * URL to which POST will be made by backend when archive finish deleting
   * @type {String}
   */
  deletedCallback: attr('string'),

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
   * @type {ComputedProperty<Models.Archive>}
   */
  baseArchive: belongsTo('archive'),

  /**
   * Relation to archive that is direct parent in nested archives hierarchy.
   * This relation should be non-empty if the archive is a part of nested archives
   * hierarchy and is not a root of that hierarchy.
   * A parent of nested archive should have `config.createNestedArchives` enabled.
   * @type {ComputedProperty<Models.Archive>}
   */
  parentArchive: belongsTo('archive'),

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

  /**
   * Provider that created and stores the archive. You can ia. get audit log of
   * archivisation using this provider.
   * @type {ComputedProperty<Models.Provider>}
   */
  // FIXME: change to "provider" after API change
  providerId: belongsTo('provider'),

  dataset: belongsTo('dataset'),
  rootDir: belongsTo('file'),

  /**
   * A less-detailed state of archive to simplify state presentation.
   * Flow: creating -> succeeded, cancelled or failed -> destroying
   * @type {ArchiveMetaState}
   */
  metaState: computed('state', function metaState() {
    switch (this.get('state')) {
      case 'pending':
      case 'building':
      case 'verifying':
      case 'cancelling':
        return 'creating';
      case 'preserved':
        return 'succeeded';
      case 'cancelled':
        return 'cancelled';
      case 'verification_failed':
      case 'failed':
        return 'failed';
      case 'deleting':
        return 'destroying';
      default:
        return 'unknown';
    }
  }),
}).reopenClass(StaticGraphModelMixin);
