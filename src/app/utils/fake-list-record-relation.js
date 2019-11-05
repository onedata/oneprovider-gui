/**
 * Additional abstraction layer for using `FakeListRecord` like a model relation
 *
 * @module utils/fake-list-record-relation
 * @author Jakub Liput
 * @copyright (C) 2018 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import PromiseObject from 'onedata-gui-common/utils/ember/promise-object';
import FakeListRecord from 'oneprovider-gui/utils/fake-list-record';
import { get } from '@ember/object';
import { reads, not } from '@ember/object/computed';
import { assert } from '@ember/debug';

export default PromiseObject.extend({
  /**
   * Initialized in init
   * @type {FakeListRecord}
   */
  _fakeListRecord: undefined,

  isLoading: reads('isPending'),
  isLoaded: not('isLoading'),

  reload() {
    return this.get('_fakeListRecord').reload(...arguments);
  },

  init() {
    this._super(...arguments);
    const initChunksArray = this.get('initChunksArray');
    assert(
      'utils:fake-list-record-relation: initChunksArray is required',
      initChunksArray != null
    );
    const _fakeListRecord = this.set('_fakeListRecord', FakeListRecord.create({
      initChunksArray: this.get('initChunksArray'),
    }));
    this.set(
      'promise',
      get(_fakeListRecord, 'chunksArray.initialLoad')
      .then(() => _fakeListRecord)
    );
  },
});
