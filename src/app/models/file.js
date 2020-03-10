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
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';
import { computed, get, getProperties } from '@ember/object';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import { later, cancel } from '@ember/runloop';
import guidToCdmiObjectId from 'oneprovider-gui/utils/guid-to-cdmi-object-id';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

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

export default Model.extend(GraphSingleModelMixin, {
  name: attr('string'),
  index: attr('string'),
  type: attr('string'),
  size: attr('number'),
  mode: attr('number'),
  hasMetadata: attr('boolean'),

  /**
   * Modification time in UNIX timestamp format.
   */
  mtime: attr('number'),

  /**
   * Posix permissions in octal three digit format.
   */
  posixPermissions: computed('mode', {
    get() {
      return (this.get('mode') || 0).toString(8);
    },
    set(key, value) {
      return this.set('mode', parseInt(value, 8));
    },
  }),

  /**
   * One of: `posix`, `acl`
   */
  activePermissionsType: attr('string'),

  acl: belongsTo('acl'),
  shareList: belongsTo('share-list'),
  parent: belongsTo('file'),
  distribution: belongsTo('file-distribution'),
  owner: belongsTo('user'),
  provider: belongsTo('provider'),

  modificationTime: alias('mtime'),

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

  isShared: computed('shareList', function isShared() {
    return Boolean(this.belongsTo('shareList').id());
  }),

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
    const pollSizeTimerId = this.get('pollSizeTimerId');
    cancel(pollSizeTimerId);

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
          this.set('isPollingSize', false);
        }
      }
    });
  },
}).reopenClass(StaticGraphModelMixin, {
  /**
   * @override
   */
  findBlockingRequests(activeRequests, operation, model) {
    const superRequests = this._super(...arguments);

    switch (operation) {
      case 'create': {
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
            requestAspect === 'children';
        });
        return superRequests.concat(listParentDirRequests);
      }
      default:
        return superRequests;
    }
  },
});
