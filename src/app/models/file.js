/**
 * Single file or directory model.
 *
 * @module models/file
 * @author Jakub Liput, Michał Borzęcki
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { alias } from '@ember/object/computed';
import { belongsTo, hasMany } from 'onedata-gui-websocket-client/utils/relationships';
import { computed, get, getProperties } from '@ember/object';
import Mixin from '@ember/object/mixin';
import gri from 'onedata-gui-websocket-client/utils/gri';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import { later, cancel } from '@ember/runloop';
import guidToCdmiObjectId from 'oneprovider-gui/utils/guid-to-cdmi-object-id';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import { bool, array } from 'ember-awesome-macros';
import { createConflictModelMixin } from 'onedata-gui-websocket-client/mixins/models/list-conflict-model';
import { hasProtectionFlag } from 'oneprovider-gui/utils/dataset-tools';

export const entityType = 'file';

// file entity id holds few values: <guid_type>#<internal_file_id>#<space_id>#<share_id>

const guidRegexp = /guid#(.*)#(.*)/;
const shareGuidRegexp = /shareGuid#(.*)#(.*)#(.*)/;

export function getInternalFileIdFromFileId(fileEntityId) {
  const decoded = atob(fileEntityId);
  const m = decoded.match(guidRegexp) || decoded.match(shareGuidRegexp);
  return m && m[1];
}

export function getSpaceIdFromFileId(fileEntityId) {
  const decoded = atob(fileEntityId);
  const m = decoded.match(guidRegexp) || decoded.match(shareGuidRegexp);
  return m && m[2];
}

export function getShareIdFromFileId(fileEntityId) {
  const decoded = atob(fileEntityId);
  const m = decoded.match(shareGuidRegexp);
  return m && m[3];
}

export function getFileGri(fileId, scope) {
  return gri({
    entityType: entityType,
    entityId: fileId,
    aspect: 'instance',
    scope,
  });
}

export const RuntimeProperties = Mixin.create({
  /**
   * Not empty when file is a symlink and points to an accessible file.
   * @type {Models.File|undefined}
   */
  symlinkTargetFile: undefined,

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
   * @type {boolean}
   */
  isShowProgress: array.includes(['copy', 'move'], 'currentOperation'),

  /**
   * One of `copy`, `move`
   * @type {string}
   */
  currentOperation: '',

  dataIsProtected: hasProtectionFlag('effProtectionFlags', 'data'),
  metadataIsProtected: hasProtectionFlag('effProtectionFlags', 'metadata'),

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
    return getSpaceIdFromFileId(this.get('entityId'));
  }),

  internalFileId: computed('entityId', function internalFileId() {
    return getInternalFileIdFromFileId(this.get('entityId'));
  }),

  /**
   * Polls file size. Will stop after `attempts` retries or when fetched size
   * will be equal `targetSize`.
   * @param {number} attempts
   * @param {number} interval time in milliseconds
   * @param {number} [targetSize=undefined]
   * @returns {undefined}
   */
  pollSize(attempts, interval, targetSize = undefined) {
    const {
      pollSizeTimerId,
      isDeleted,
    } = this.getProperties('pollSizeTimerId', 'isDeleted');

    cancel(pollSizeTimerId);
    if (isDeleted) {
      return;
    }

    this.set('isPollingSize', true);
    this.reload().then(() => {
      const {
        size,
        isDeleted,
      } = this.getProperties('size', 'isDeleted');
      if (pollSizeTimerId === this.get('pollSizeTimerId')) {
        if (size !== targetSize && !isDeleted && attempts > 1) {
          this.set(
            'pollSizeTimerId',
            later(this, 'pollSize', attempts - 1, interval, targetSize, interval)
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
    name: attr('string'),
    index: attr('string'),
    type: attr('file-type'),
    size: attr('number'),
    posixPermissions: attr('string'),
    hasMetadata: attr('boolean'),

    sharesCount: attr('number'),
    hardlinksCount: attr('number', { defaultValue: 1 }),

    /**
     * Not empty only for symlinks. Contains target path. May contain any string,
     * but in general it may look like this (relative path):
     * `../some/file`
     * or like this (absolute path):
     * `<__onedata_space_id:cbe3808d32b011f8578877ca531ad214chfb28>/some/file`
     */
    targetPath: attr('string'),

    /**
     * Possible values: none, direct, ancestor
     */
    effQosMembership: attr('string', { defaultValue: 'none' }),

    /**
     * Possible values: none, direct, ancestor
     */
    effDatasetMembership: attr('string', { defaultValue: 'none' }),

    /**
     * Available values in array: 'data_protection', 'metadata_protection'
     * Effective protection flags - concerning attached ancestor dataset flags.
     * @type {ComputedProperty<Array>}
     */
    effProtectionFlags: attr('array'),

    /**
     * Modification time in UNIX timestamp format.
     */
    mtime: attr('number'),

    /**
     * One of: `posix`, `acl`. Cannot be modified
     */
    activePermissionsType: attr('string'),

    shareRecords: hasMany('share'),

    acl: belongsTo('acl'),
    parent: belongsTo('file'),
    distribution: belongsTo('file-distribution'),
    owner: belongsTo('user'),
    provider: belongsTo('provider'),
    fileQosSummary: belongsTo('file-qos-summary'),
    fileDatasetSummary: belongsTo('file-dataset-summary'),

    /**
     * Relation to archive model if this file is a root dir of archive.
     * @type {Models.Archive}
     */
    archive: belongsTo('archive'),

    modificationTime: alias('mtime'),
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
