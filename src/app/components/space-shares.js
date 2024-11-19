/**
 * List and show share browsers that belong to some space
 *
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { promise, collect } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';

export default Component.extend({
  classNames: ['space-shares', 'fill-flex-using-column'],

  shareManager: service(),
  spaceManager: service(),
  appProxy: service(),

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
  onShowShareList: notImplementedThrow,

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

  /**
   * @virtual optional
   * @type {ShareShowTabId}
   */
  initialTabId: undefined,

  oneproviderName: reads('appProxy.injectedData.oneproviderName'),

  shareActions: collect('btnDelete', 'btnRename'),

  spaceProxy: promise.object(computed('spaceId', function spacesProxy() {
    return this.spaceManager.getSpace(this.spaceId);
  })),

  shareProxy: promise.object(computed('shareId', function shareProxy() {
    const {
      shareManager,
      shareId,
    } = this;
    return shareId ? shareManager.getShare(shareId) : null;
  })),

  actions: {
    getShareUrl(...args) {
      return this.getShareUrl(...args);
    },
    updateDirId(dirId) {
      return this.updateDirId(dirId);
    },
    getDataUrl(...args) {
      return this.getDataUrl(...args);
    },
    // FIXME: share to teraz OneproviderShareListItem
    startRemoveShare(share) {
      this.set('shareToRemove', share);
    },
    startRenameShare(share) {
      this.set('shareToRename', share);
    },
    closeRemoveShare() {
      // FIXME: dorobić odświeżanie listy
      this.set('shareToRemove', null);
    },
    closeRenameShare() {
      // FIXME: dorobić odświeżanie listy
      this.set('shareToRename', null);
    },
    onShowShareList() {
      return this.onShowShareList();
    },
    async reloadShareList() {
      // FIXME: zmienić implementację, być może do wyrzucenia
    },
  },
});
