/**
 * Single file or directory model.
 * 
 * @module models/file
 * @author Jakub Liput, Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { promise } from 'ember-awesome-macros';
import { alias, not } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';
import { computed, get } from '@ember/object';
import { later, cancel } from '@ember/runloop';
import guidToCdmiObjectId from 'oneprovider-gui/utils/guid-to-cdmi-object-id';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

export const entityType = 'file';

const guidRegexp = /guid#(.*)#(.*)/;
const shareGuidRegexp = /shareGuid#(.*)#(.*)#(.*)/;

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
  parent: belongsTo('file'),
  distribution: belongsTo('file-distribution'),
  owner: belongsTo('user'),

  /**
   * Modification time in UNIX timestamp format.
   */
  mtime: attr('number'),

  /**
   * Posix permissions in octal three digit format.
   */
  posixPermissions: attr('string'),

  /**
   * One of: `posix`, `acl`
   */
  activePermissionsType: attr('string'),

  acl: belongsTo('acl'),

  modificationTime: alias('mtime'),

  secondaryType: null,

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

  isShared: computed('share', function isShared() {
    return Boolean(this.belongsTo('share').id());
  }),

  share: belongsTo('share'),

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
        const rpcRequests = get(activeRequests, 'rpcRequests');
        // Block on listing parent dir files FIXME: new API
        const listParentDirRequests = rpcRequests.filter(request => {
          return get(request, 'rpcMethodName') === 'getDirChildren' &&
            get(request, 'data.guid') === get(model.belongsTo('parent').value(),
              'entityId');
        });
        return superRequests.concat(listParentDirRequests);
      }
      default:
        return superRequests;
    }
  },
});
