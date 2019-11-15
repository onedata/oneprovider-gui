/**
 * Ember Class for using some ReplacingChunksArray as a record containing list
 * property
 *
 * @module utils/fake-list-record
 * @author Jakub Liput
 * @copyright (C) 2018 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed } from '@ember/object';

// FIXME: remove this and use replacing chunks array directly

export default EmberObject.extend({
  /**
   * @virtual 
   * @type {ReplacingChunksArray}
   */
  initChunksArray: undefined,

  chunksArray: computed.reads('_chunksArray'),

  length: computed.reads('chunksArray.length'),

  reload() {
    return this.get('_chunksArray')
      .reload(...arguments)
      .then(() => this);
  },

  init() {
    this._super(...arguments);
    this.set('_chunksArray', this.get('initChunksArray'));
  },
});
