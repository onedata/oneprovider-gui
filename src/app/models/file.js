/**
 * Single file or directory model.
 * 
 * @module models/file
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { alias } from '@ember/object/computed';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';
import { computed } from '@ember/object';
import { later, cancel } from '@ember/runloop';

import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

export default Model.extend(GraphSingleModelMixin, {
  name: attr('string'),
  index: attr('string'),
  type: attr('string'),
  size: attr('number'),
  parent: belongsTo('file'),

  /**
   * Modification time in UNIX timestamp format.
   */
  mtime: attr('number'),

  modificationTime: alias('mtime'),

  /**
   * @type {boolean}
   */
  isPoolingSize: false,

  /**
   * @type {any}
   */
  poolSizeTimerId: null,

  hasParent: computed(function hasParent() {
    return Boolean(this.belongsTo('parent').id());
  }),

  /**
   * Pools file size. Will stop after `attempts` retries or when fetched size
   * will be equal `targetSize`.
   * @param {number} attempts 
   * @param {number} interval time in milliseconds
   * @param {number} [targetSize=undefined]
   * @returns {undefined}
   */
  poolSize(attempts, interval, targetSize = undefined) {
    const poolSizeTimerId = this.get('poolSizeTimerId');
    cancel(poolSizeTimerId);
    
    this.set('isPoolingSize', true);
    this.reload().then(() => {
      const {
        size,
        isDeleted,
      } = this.getProperties('size', 'isDeleted');
      if (poolSizeTimerId === this.get('poolSizeTimerId')) {
        if (size !== targetSize && !isDeleted && attempts > 0) {
          this.set(
            'poolSizeTimerId',
            later(this, 'poolSize', attempts - 1, interval, targetSize, interval)
          );
        } else {
          this.set('isPoolingSize', false);
        }
      }
    });
  },
});
