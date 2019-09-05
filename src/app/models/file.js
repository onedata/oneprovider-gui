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
import { alias } from '@ember/object/computed';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';
import { computed, get } from '@ember/object';
import { later, cancel } from '@ember/runloop';
import { promise, raw } from 'ember-awesome-macros';
import { resolve } from 'rsvp';

import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

export default Model.extend(GraphSingleModelMixin, {
  name: attr('string'),
  index: attr('string'),
  type: attr('string'),
  size: attr('number'),
  parent: belongsTo('file'),

  // FIXME: test values:
  owner: promise.object(raw(resolve({ fullName: 'Test User' }))),
  cdmiObjectId: '000000203203203012301203203020002030000000',

  // FIXME: unlock when backend will be done
  // cdmiObjectId: attr('string'),
  // owner: belongsTo('sharedUser'),

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

  /**
   * @type {boolean}
   */
  isPollingSize: false,

  /**
   * @type {any}
   */
  pollSizeTimerId: null,

  hasParent: computed(function hasParent() {
    return Boolean(this.belongsTo('parent').id());
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
        // Block on listing parent dir files
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
