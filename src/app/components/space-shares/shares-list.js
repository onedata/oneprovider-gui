/**
 * List of shares for single space
 *
 * @module components/space-shares/shares-list
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { all as allFulfilled } from 'rsvp';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { promise } from 'ember-awesome-macros';

export default Component.extend(createDataProxyMixin('sharesWithDeletedFiles'), {
  classNames: ['shares-list'],

  /**
   * @virtual
   * @type {Function}
   */
  getShareUrl: undefined,

  /**
   * @virtual optional
   * @type {Function}
   */
  getDataUrl: undefined,

  /**
   * @virtual
   * @type {String}
   */
  spaceId: undefined,

  /**
   * @virtual
   * @type {PromiseArray<Models.Share>}
   */
  sharesProxy: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  startRemoveShare: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   */
  startRenameShare: notImplementedThrow,

  dataTabUrl: computed('spaceId', function dataTabUrl() {
    const {
      getDataUrl,
      spaceId,
    } = this.getProperties('getDataUrl', 'spaceId');
    return getDataUrl({ spaceId });
  }),

  /**
   * @type {ComputedProperty<PromiseObject>}
   */
  dataProxy: promise.object(promise.all('sharesProxy', 'sharesWithDeletedFilesProxy')),

  /**
   * @override
   */
  fetchSharesWithDeletedFiles() {
    return this.get('sharesProxy')
      .then(shares => allFulfilled(
        shares.map(share => share.getRelation('rootFile')
          .then(() => null)
          .catch(error => get(error || {}, 'details.errno') === 'enoent' ? share : null)
        )))
      .then(shares => shares.compact());
  },

  actions: {
    getShareUrl(...args) {
      return this.get('getShareUrl')(...args);
    },
    startRemoveShare(...args) {
      return this.get('startRemoveShare')(...args);
    },
    startRenameShare(...args) {
      return this.get('startRenameShare')(...args);
    },
  },
});
