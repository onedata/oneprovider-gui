/**
 * Single file or directory model.
 *
 * # BASIC PROPERTIES
 *
 * The File model could be fetched from backend with custom set of attributes.
 * In frontend, we use FileRequirementRegistry service to manage properties that
 * are needed by currently used components, object, etc. called File Consumers.
 *
 * There are many File Consumers that need only a small set of file attributes, so
 * there is a set of often used properties called Basic Properties. The file requirement
 * system is configured to always fetch the Basic Properties from backend.
 * When using only these properties, you should not do anything special.
 *
 * The Basic Properties are declared in regions:
 * - basic runtime properties
 * - basic attributes
 *
 * You can see alse current set of basic properties in FileRequirementRegistry service.
 *
 * # CUSTOM PROPERTIES
 *
 * If you want to use file attributes that are not listed in the Basic Properties,
 * you must implement a FileConsumerMixin in your class. See FileConsumerMixin docs
 * for details.
 *
 * Custom properties are declared in regions:
 * - custom runtime properties
 * - custom attributes
 *
 * @author Jakub Liput, Michał Borzęcki
 * @copyright (C) 2019-2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo, hasMany } from 'onedata-gui-websocket-client/utils/relationships';
import { computed, get, getProperties } from '@ember/object';
import Mixin from '@ember/object/mixin';
import gri from 'onedata-gui-websocket-client/utils/gri';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import { later, cancel } from '@ember/runloop';
import guidToCdmiObjectId from 'oneprovider-gui/utils/guid-to-cdmi-object-id';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import { bool, array, promise, or, eq, raw } from 'ember-awesome-macros';
import { createConflictModelMixin } from 'onedata-gui-websocket-client/mixins/models/list-conflict-model';
import { hasProtectionFlag } from 'oneprovider-gui/utils/dataset-tools';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import {
  getInternalFileIdFromGuid,
  getSpaceIdFromGuid,
} from 'onedata-gui-common/utils/file-guid-parsers';

/**
 * @typedef {'data_protection'|'metadata_protection'} ProtectionFlag
 */

/**
 * @typedef {'impossible'|'pending'|'fulfilled'|'error'|null} QosStatus
 */

export const entityType = 'file';

export function getFileGri(fileId, scope) {
  return gri({
    entityType: entityType,
    entityId: fileId,
    aspect: 'instance',
    scope,
  });
}

export const dirSizeStatsTimeSeriesNameGenerators = {
  regFileAndLinkCount: 'reg_file_and_link_count',
  dirCount: 'dir_count',
  totalSize: 'total_size',
  sizeOnStorage: 'storage_use_',
};

export const RuntimeProperties = Mixin.create({
  //#region runtime basic properties

  /**
   * Properties declared in this region are always available in file record.
   * See BASIC PROPERTIES section in head documentation for details.
   */

  /**
   * When file is a symlink, then `effFile` is the file pointed
   * by the symlink (so can be empty). For other types of files it points to
   * the same file (as normal file can be treated as a "symlink to itself").
   * @type {Models.File}
   */
  effFile: computed('type', 'symlinkTargetFile', function effFile() {
    const {
      type,
      symlinkTargetFile,
    } = this.getProperties('type', 'symlinkTargetFile');
    return type === 'symlink' ? symlinkTargetFile : this;
  }),

  hasParent: computed(function hasParent() {
    return Boolean(this.belongsTo('parent').id());
  }),

  /**
   * Name of file ignoring naming conflict.
   * @type {ComputedProperty<string>}
   */
  originalName: or('conflictingName', 'name'),

  cdmiObjectId: computed('entityId', function cdmiObjectId() {
    try {
      return guidToCdmiObjectId(this.get('entityId'));
    } catch (error) {
      console.trace();
      console.error(error);
      return 'error';
    }
  }),

  spaceEntityId: computed('entityId', function spaceEntityId() {
    return getSpaceIdFromGuid(this.get('entityId'));
  }),

  internalFileId: computed('entityId', function internalFileId() {
    return getInternalFileIdFromGuid(this.get('entityId'));
  }),

  //#endregion

  //#region custom runtime properties

  /**
   * Properties declared in this region are available in records only if the file
   * requirement system is used.
   * See CUSTOM PROPERTIES section in this file header documentation for details.
   */

  dataIsProtected: hasProtectionFlag('effProtectionFlags', 'data'),
  metadataIsProtected: hasProtectionFlag('effProtectionFlags', 'metadata'),

  dataIsProtectedByDataset: hasProtectionFlag('effDatasetProtectionFlags', 'data'),
  metadataIsProtectedByDataset: hasProtectionFlag('effDatasetProtectionFlags', 'metadata'),

  isShared: bool('sharesCount'),

  isArchiveRootDir: computed(function isArchiveRootDir() {
    return Boolean(this.belongsTo('archive').id());
  }),

  /**
   * Membership of running archive recall process:
   * - direct - if the file is a target (root) for recall process
   * - ancestor - if the file is a descendant of root for recall process (as above)
   * - none - none of above or the associated recall process finished
   * @type {ComputedProperty<PromiseObject<null|'none'|'direct'|'ancestor'>>}
   */
  recallingMembershipProxy: promise.object(computed(
    'recallRootId',
    'archiveRecallInfo.finishTime',
    async function recallingMembershipProxy() {
      const {
        recallRootId,
        entityId,
      } = this.getProperties('recallRootId', 'entityId');
      if (recallRootId) {
        const archiveRecallInfoContent = await this.get('archiveRecallInfo');
        if (
          archiveRecallInfoContent &&
          get(archiveRecallInfoContent, 'finishTime')
        ) {
          return 'none';
        } else {
          return recallRootId === entityId ? 'direct' : 'ancestor';
        }
      } else {
        return 'none';
      }
    }
  )),

  /**
   * @type {ComputedProperty<null|'none'|'direct'|'ancestor'>}
   */
  recallingMembership: computedLastProxyContent('recallingMembershipProxy'),

  isRecalling: or(
    eq('recallingMembership', raw('direct')),
    eq('recallingMembership', raw('ancestor')),
  ),

  isRecalledProxy: promise.object(computed(
    'recallRootId',
    'archiveRecallInfo.finishTime',
    async function recallingMembershipProxy() {
      const recallRootId = this.get('recallRootId');
      if (recallRootId) {
        const archiveRecallInfoContent = await this.get('archiveRecallInfo');
        return Boolean(
          archiveRecallInfoContent &&
          get(archiveRecallInfoContent, 'finishTime')
        );
      } else {
        return false;
      }
    }
  )),

  isRecalled: computedLastProxyContent('isRecalledProxy'),

  sharesCount: computed('shareRecords', function sharesCount() {
    return this.hasMany('shareRecords')?.ids().length;
  }),

  //#endregion

  //#region runtime record state

  /**
   * Properties set and managed in runtime, without backend attributes relation.
   */

  /**
   * Not empty when file is a symlink and points to an accessible file.
   * @type {Models.File|undefined}
   */
  symlinkTargetFile: undefined,

  /**
   * Contains error of loading file distribution. Is null if distribution has not
   * been fetched yet or it has been fetched successfully. It is persisted in this place
   * due to the bug in Ember that makes belongsTo relationship unusable after
   * rejected fetch (id and value become null).
   * @type {Object}
   */
  distributionLoadError: null,

  /**
   * @type {boolean}
   */
  isPollingSize: false,

  /**
   * @type {any}
   */
  pollSizeTimerId: null,

  /**
   * One of `copy`, `move`
   * @type {string}
   */
  currentOperation: '',

  /**
   * @type {boolean}
   */
  isCopyingMovingStop: false,

  /**
   * @type {boolean}
   */
  isShowProgress: array.includes(['copy', 'move'], 'currentOperation'),

  //#endregion

  /**
   * Polls file size. Will stop after `attempts` retries or when fetched size
   * will be equal `targetSize`.
   * @param {number} interval time in milliseconds
   * @param {number} [targetSize=undefined]
   * @param {number} [attempts=undefined]
   * @returns {undefined}
   */
  pollSize(interval, targetSize = undefined, attempts = undefined) {
    const {
      pollSizeTimerId,
      isDeleted,
      isCopyingMovingStop,
    } = this.getProperties('pollSizeTimerId', 'isDeleted', 'isCopyingMovingStop');

    cancel(pollSizeTimerId);
    if (isDeleted || isCopyingMovingStop) {
      this.setProperties({
        isPollingSize: false,
        currentOperation: '',
        isCopyingMovingStop: false,
      });
      return;
    }

    this.set('isPollingSize', true);
    this.reload().then(() => {
      const {
        size,
        isDeleted,
      } = this.getProperties('size', 'isDeleted');
      if (pollSizeTimerId === this.get('pollSizeTimerId')) {
        if (
          size !== targetSize &&
          !isDeleted &&
          ((typeof attempts !== 'number') || attempts > 1)
        ) {
          this.set(
            'pollSizeTimerId',
            later(
              this,
              'pollSize',
              interval,
              targetSize,
              attempts ? attempts - 1 : attempts,
              interval
            )
          );
        } else {
          this.setProperties({
            isPollingSize: false,
            currentOperation: '',
          });
        }
      }
    });
  },
});

export default Model.extend(
  GraphSingleModelMixin,
  RuntimeProperties,
  createConflictModelMixin('shareRecords'), {
    //#region basic attributes

    /**
     * Properties declared in this region are always available in file record.
     * See BASIC PROPERTIES section in this file header documentation for details.
     */

    /**
     * If there is a filename conflict between providers (two files with the same name,
     * but created on different providers) this property contains a base of file name.
     * Eg. we have two files with the same name created on providers with ids "a123" and
     * "b456":
     *
     * ```
     * { name: 'hello@a123', conflictingName: 'hello' }
     * { name: 'hello@b456', conflictingName: 'hello' }
     * ```
     *
     * If there is no naming conflict, the `name` is without suffix and this property
     * is not provided (empty).
     */
    conflictingName: attr('string'),

    name: attr('string'),

    /**
     * Not empty only for symlinks. Contains target path. May contain any string,
     * but in general it may look like this (relative path):
     * `../some/file`
     * or like this (absolute path):
     * `<__onedata_space_id:cbe3808d32b011f8578877ca531ad214chfb28>/some/file`
     * @type {ComputedProperty<string>}
     */
    symlinkValue: attr('string'),

    type: attr('file-type'),

    parent: belongsTo('file'),

    /**
     * Async relations below are always available to resolve, because they base on
     * the file ID.
     */

    acl: belongsTo('acl'),
    distribution: belongsTo('file-distribution'),
    fileQosSummary: belongsTo('file-qos-summary'),
    fileDatasetSummary: belongsTo('file-dataset-summary'),
    storageLocationInfo: belongsTo('storage-location-info'),
    archiveRecallInfo: belongsTo('archive-recall-info'),
    archiveRecallState: belongsTo('archive-recall-state'),

    //#endregion

    //#region custom attributes

    /**
     * Properties declared in this region are available in records only if the file
     * requirement system is used.
     * See CUSTOM PROPERTIES section in this file header documentation for details.
     */

    index: attr('string'),
    size: attr('number'),
    posixPermissions: attr('string'),
    hasMetadata: attr('boolean'),
    hardlinksCount: attr('number', { defaultValue: 1 }),
    localReplicationRate: attr('number'),

    /**
     * @type {ComputedProperty<QosStatus>}
     */
    qosStatus: attr('string'),

    /**
     * Possible values: none, direct, ancestor, directAndAncestor
     */
    effQosMembership: attr('string', { defaultValue: 'none' }),

    /**
     * Possible values: none, direct, ancestor, directAndAncestor
     */
    effDatasetMembership: attr('string', { defaultValue: 'none' }),

    /**
     * Effective protection flags inherited from attached ancestor dataset flags.
     * @type {ComputedProperty<Array<ProtectionFlag>>}
     */
    effDatasetProtectionFlags: attr('array'),

    /**
     * Effective protection flags - concerning attached ancestor dataset flags and
     * flags inherited from hardlinks.
     * @type {ComputedProperty<Array<ProtectionFlag>>}
     */
    effProtectionFlags: attr('array'),

    /**
     * If file is a recalled archive root or descendant of one, GUID of recalled archive
     * root. Null or empty otherwise.
     * @type {ComputedProperty<string>}
     */
    recallRootId: attr('string'),

    /**
     * Modification time in UNIX timestamp format.
     */
    mtime: attr('number'),

    atime: attr('number'),
    ctime: attr('number'),

    /**
     * One of: `posix`, `acl`. Cannot be modified
     */
    activePermissionsType: attr('string'),

    storageGroupId: attr('string'),
    storageUserId: attr('string'),

    shareRecords: hasMany('share'),

    /**
     * NOTE: User record from this relation can be fetched only if the user has been
     * already fetched using authHint (eg. using userManager or from space.userList).
     * If you want to fetch owner before this, consider using `fileManager.getFileOwner`.
     */
    owner: belongsTo('user'),
    provider: belongsTo('provider'),

    /**
     * Relation to archive model if this file is a root dir of archive.
     * @type {Models.Archive}
     */
    archive: belongsTo('archive'),

    //#endregion
  }
).reopenClass(StaticGraphModelMixin, {
  /**
   * @override
   */
  findBlockingRequests(activeRequests, operation, model) {
    const superRequests = this._super(...arguments);

    switch (operation) {
      case 'create':
      case 'delete': {
        const graphRequests = get(activeRequests, 'graphRequests');
        // Block on listing parent dir files
        const listParentDirRequests = graphRequests.filter(request => {
          const {
            operation: requestOperation,
            gri: requestGri,
          } = getProperties(
            get(request, 'data'),
            'operation',
            'gri'
          );
          const {
            entityType: requestEntityType,
            entityId: requestEntityId,
            aspect: requestAspect,
          } = getProperties(
            parseGri(requestGri),
            'entityType',
            'entityId',
            'aspect'
          );

          return requestOperation === 'get' &&
            requestEntityType === entityType &&
            requestEntityId ===
            get(model.belongsTo('parent').value(), 'entityId') &&
            requestAspect &&
            requestAspect.startsWith('children');
        });
        return superRequests.concat(listParentDirRequests);
      }
      default:
        return superRequests;
    }
  },
});
