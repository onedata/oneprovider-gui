/**
 * Polls for archive recall info and state for specified `targetFile`.
 *
 * @module utils/archive-recall-state-watcher
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { get } from '@ember/object';
import { bool } from 'ember-awesome-macros';
import Looper from 'onedata-gui-common/utils/looper';
import { inject as service } from '@ember/service';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { all as allSettled } from 'rsvp';

export default EmberObject.extend(OwnerInjector, {
  fileManager: service(),

  /**
   * @virtual
   * @type {File}
   */
  targetFile: undefined,

  /**
   * Inverval of looper in milliseconds.
   * @virtual optional
   * @type {Number}
   */
  interval: 2000,

  /**
   * Created on `start`.
   * @type {Looper}
   */
  looper: null,

  /**
   * Stores entity IDs of directories to be auto-refreshed on update.
   * Created on init.
   * @type {Set<String>}
   */
  refreshedDirsIdSet: null,

  lastInfoError: null,

  lastStateError: null,

  /**
   * @type {Boolean}
   */
  isPolling: bool('looper'),

  /**
   * When `'state'` - poll for state and reload info only if needed.
   * When `'info'` - poll only for info.
   * When `'all'` - poll both for state and info.
   * Normally 'state' pollingMode should be used, but when state is not available (eg. because
   * we are on another provider and does not have access to progress) we can fall back to
   * polling only info (watch `finishTime` changes).
   * @type {'state'|'info'|'all'}
   */
  pollingMode: 'state',

  init() {
    this._super(...arguments);
    this.set('refreshedDirsIdSet', new Set());
  },

  /**
   * @override
   */
  destroy() {
    try {
      this._super(...arguments);
    } finally {
      this.stop();
    }
  },

  start() {
    if (this.get('looper')) {
      return;
    }
    const looper = new Looper({
      immediate: true,
      interval: this.get('interval'),
    });
    looper.on('tick', () => this.update());
    this.set('looper', looper);
  },

  stop() {
    const looper = this.get('looper');
    if (looper) {
      looper.destroy();
      this.set('looper', null);
    }
  },

  async update() {
    let pollingMode = this.get('pollingMode');
    let info;
    let state;
    let shouldUpdateInfo;
    let isFinished;
    try {
      info = await this.getInfo();
    } catch (getInfoError) {
      console.error(
        'util:archive-recall-state-watcher#update: getInfo failed',
        getInfoError
      );
      this.set('lastInfoError', getInfoError);
      this.stop();
      return;
    }
    isFinished = Boolean(get(info, 'finishTime'));
    if (isFinished) {
      this.stop();
      return;
    }
    if (pollingMode !== 'info' && !get(info, 'isOnLocalProvider')) {
      pollingMode = this.set('pollingMode', 'info');
    } else if (
      pollingMode !== 'all' &&
      get(info, 'cancelTime') &&
      get(info, 'isOnLocalProvider')
    ) {
      pollingMode = this.set('pollingMode', 'all');
    }
    if (pollingMode === 'state' || pollingMode === 'all') {
      try {
        state = await this.reloadState();
      } catch (reloadStateError) {
        console.error(
          'util:archive-recall-state-watcher#update: reloadState failed',
          reloadStateError
        );
        this.set('lastStateError', reloadStateError);
        pollingMode = this.set('pollingMode', 'info');
      }
    }
    // pollingMode could change if reloadState failed, so check one more time
    if (pollingMode === 'state' || pollingMode === 'all') {
      isFinished = isFinished || state.isFinished(info);
    }
    if (pollingMode === 'state') {
      shouldUpdateInfo = (
        !get(info, 'startTime') && get(state, 'bytesCopied')
      ) || isFinished;
    }
    if (pollingMode === 'info' || pollingMode === 'all') {
      shouldUpdateInfo = true;
    }
    if (shouldUpdateInfo) {
      try {
        await this.reloadInfo();
      } catch (reloadInfoError) {
        console.error(
          'util:archive-recall-state-watcher#update: reloadInfo failed',
          reloadInfoError
        );
        this.set('lastInfoError', reloadInfoError);
        this.stop();
        return;
      }
    }
    this.updateFileBrowsers();
    if (isFinished) {
      this.stop();
    }
  },

  addToAutoRefresh(file) {
    const refreshedDirsIdSet = this.get('refreshedDirsIdSet');
    const dirToRefreshId = this.getDirIdToRefresh(file);
    refreshedDirsIdSet.add(dirToRefreshId);
  },

  /**
   * @param {Models.File} file
   * @returns {String}
   */
  getDirIdToRefresh(file) {
    return get(file, 'type') === 'dir' ?
      get(file, 'entityId') : file.relationEntityId('parent');
  },

  async updateFileBrowsers() {
    const {
      refreshedDirsIdSet,
      fileManager,
    } = this.getProperties('refreshedDirsIdSet', 'fileManager');
    if (refreshedDirsIdSet.size) {
      await allSettled([...refreshedDirsIdSet].map(dirId =>
        fileManager.dirChildrenRefresh(dirId)
      ));
    }
  },

  /**
   * @private
   * @returns {Promise<Models.ArchiveRecallInfo>}
   */
  async getInfo() {
    return this.get('targetFile.archiveRecallInfo.content') ||
      this.get('targetFile').getRelation('archiveRecallInfo');
  },

  /**
   * @private
   * @returns {Promise<Models.ArchiveRecallInfo>}
   */
  reloadInfo() {
    return this.get('targetFile').getRelation('archiveRecallInfo', { reload: true });
  },

  /**
   * @private
   * @returns {Promise<Models.ArchiveRecallState>}
   */
  reloadState() {
    return this.get('targetFile').getRelation('archiveRecallState', { reload: true });
  },
});
