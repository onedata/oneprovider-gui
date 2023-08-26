/**
 * Single file or directory model.
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
import FileRequirement from 'oneprovider-gui/utils/file-requirement';
import FileConsumerMixin from 'oneprovider-gui/mixins/file-consumer';

/**
 * @typedef {'data_protection'|'metadata_protection'} ProtectionFlag
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

  /**
   * Name of file ignoring naming conflict.
   * @type {ComputedProperty<string>}
   */
  originalName: or('conflictingName', 'name'),

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

  dataIsProtected: hasProtectionFlag('effProtectionFlags', 'data'),
  metadataIsProtected: hasProtectionFlag('effProtectionFlags', 'metadata'),

  dataIsProtectedByDataset: hasProtectionFlag('effDatasetProtectionFlags', 'data'),
  metadataIsProtectedByDataset: hasProtectionFlag('effDatasetProtectionFlags', 'metadata'),

  isShared: bool('sharesCount'),

  cdmiObjectId: computed('entityId', function cdmiObjectId() {
    try {
      return guidToCdmiObjectId(this.get('entityId'));
    } catch (error) {
      console.trace();
      console.error(error);
      return 'error';
    }
  }),

  hasParent: computed(function hasParent() {
    return Boolean(this.belongsTo('parent').id());
  }),

  isArchiveRootDir: computed(function isArchiveRootDir() {
    return Boolean(this.belongsTo('archive').id());
  }),

  spaceEntityId: computed('entityId', function spaceEntityId() {
    return getSpaceIdFromGuid(this.get('entityId'));
  }),

  internalFileId: computed('entityId', function internalFileId() {
    return getInternalFileIdFromGuid(this.get('entityId'));
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

const FileRelationConsumer = Mixin.create(FileConsumerMixin, {
  // FIXME: użyć gdzieś tego
  async getRelation(relationName, options) {
    const requiredProperties = options.requiredProperties;
    if (requiredProperties) {
      // FIXME: eksperymentalnie uproszczone: będzie trzeba zarządzać wieloma relacjami
      // w File wystarczy jedno
      const fileGri = this.belongsTo(relationName)?.id();
      if (!fileGri) {
        return null;
      }
      const fileRequirement = FileRequirement.create({
        // FIXME: debug
        test: 'lolololo',
        fileGri,
        properties: requiredProperties,
      });
      this.set('fileRequirements', [fileRequirement]);
    }
    return await this._super(...arguments);
  },
});

export default Model.extend(
  GraphSingleModelMixin,
  FileRelationConsumer,
  RuntimeProperties,
  createConflictModelMixin('shareRecords'), {
    name: attr('string'),
    index: attr('string'),
    type: attr('file-type'),
    size: attr('number'),
    posixPermissions: attr('string'),
    hasMetadata: attr('boolean'),
    sharesCount: attr('number'),
    hardlinksCount: attr('number', { defaultValue: 1 }),
    localReplicationRate: attr('number'),

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

    /**
     * Not empty only for symlinks. Contains target path. May contain any string,
     * but in general it may look like this (relative path):
     * `../some/file`
     * or like this (absolute path):
     * `<__onedata_space_id:cbe3808d32b011f8578877ca531ad214chfb28>/some/file`
     * @type {ComputedProperty<string>}
     */
    symlinkValue: attr('string'),

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

    /**
     * FIXME: nazwa tego pola może być myląca w odniesieniu do localReplicationRate
     * ONLY for regular files. True if the file is fully replicated on current provider.
     * Typically this property should not be used - use
     * @type {ComputedProperty<boolean>}
     */
    isFullyReplicated: attr('boolean'),

    isDeleted: attr('boolean'),
    qosStatus: attr('string'),
    storageGroupId: attr('string'),
    storageUserId: attr('string'),

    shareRecords: hasMany('share'),

    acl: belongsTo('acl'),
    parent: belongsTo('file'),
    distribution: belongsTo('file-distribution'),
    storageLocationInfo: belongsTo('storage-location-info'),
    // NOTE: User record from this relation can be fetched only if the user has been
    // already fetched using authHint (eg. using userManager or from space.userList).
    // If you want to fetch owner before this, consider using `fileManager.getFileOwner`.
    owner: belongsTo('user'),
    provider: belongsTo('provider'),
    fileQosSummary: belongsTo('file-qos-summary'),
    fileDatasetSummary: belongsTo('file-dataset-summary'),
    archiveRecallInfo: belongsTo('archive-recall-info'),
    archiveRecallState: belongsTo('archive-recall-state'),

    /**
     * Relation to archive model if this file is a root dir of archive.
     * @type {Models.Archive}
     */
    archive: belongsTo('archive'),

    // FIXME: co to jest?
    conflictingFiles: attr('array'),
  }).reopenClass(StaticGraphModelMixin, {
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
