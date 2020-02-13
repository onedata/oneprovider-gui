/**
 * List and show share browsers that belong to some space
 * 
 * @module components/space-shares
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { promise, collect } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';

export default Component.extend(createDataProxyMixin('shares'), {
  classNames: ['space-shares'],

  shareManager: service(),
  spaceManager: service(),

  /**
   * @virtual
   * @type {Function}
   */
  getShareUrl: notImplementedThrow,

  /**
   * @virtual optional
   * Used for redirecting to directory in file browser in Onezone data tab
   * @type {Function}
   */
  getDataUrl: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   */
  updateDirId: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   */
  showShareList: notImplementedThrow,

  /**
   * @virtual
   * @type {String}
   */
  spaceId: undefined,

  /**
   * @virtual
   * @type {String}
   */
  dirId: undefined,

  /**
   * @virtual
   * @type {String}
   */
  shareId: undefined,

  shareActions: collect('btnDelete', 'btnRename'),

  spaceProxy: promise.object(computed('spaceId', function spacesProxy() {
    const {
      spaceId,
      spaceManager,
    } = this.getProperties('spaceId', 'spaceManager');
    return spaceManager.getSpace(spaceId);
  })),

  shareProxy: promise.object(computed('shareId', function shareProxy() {
    const {
      shareManager,
      shareId,
    } = this.getProperties('shareManager', 'shareId');
    return shareId ? shareManager.getShare(shareId) : null;
  })),

  /**
   * @override
   */
  fetchShares() {
    return this.get('spaceProxy')
      .then(space => get(space, 'shareList'))
      .then(shareList => get(shareList, 'list'));
  },

  actions: {
    getShareUrl(...args) {
      return this.get('getShareUrl')(...args);
    },
    updateDirId(dirId) {
      return this.get('updateDirId')(dirId);
    },
    getDataUrl(...args) {
      return this.get('getDataUrl')(...args);
    },
    startRemoveShare(share) {
      this.set('shareToRemove', share);
    },
    startRenameShare(share) {
      this.set('shareToRename', share);
    },
    closeRemoveShare() {
      this.set('shareToRemove', null);
    },
    closeRenameShare() {
      this.set('shareToRename', null);
    },
    showShareList() {
      return this.get('showShareList')();
    },
    reloadShareList() {
      return this.updateSharesProxy();
    },
  },
});
