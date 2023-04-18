/**
 * Manage state updates of recall (info and state).
 *
 * If you want to have polling of recall state (stored and accessible globally in app)
 * for a file enabled during component life, use `watchRecall` method until component
 * is destroyed.
 * It will return a token that should be stored and used in `unwatchRecall` method when
 * polling is no longer needed.
 * The manager makes sure, that if multiple entities (eg. component) watches file's
 * recall state, there is only one watcher for recall root. It is useful if you want to
 * watch recall state for files with inherited recalling state.
 *
 * This manager uses `ArchiveRecallStateWatcher` objects, that are doing polling
 * only when the polling is needed (recall is not finished) and handle errors.
 * See `util:archive-recall-state-watcher` for details.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service from '@ember/service';
import ArchiveRecallStateWatcher from 'oneprovider-gui/utils/archive-recall-state-watcher';
import { v4 as uuid } from 'ember-uuid';
import { get } from '@ember/object';

/**
 * @typedef {Object} ArchiveRecallStateManagerEntry
 * @property {Set<String>} tokens tokens generated for registered clients that
 *   want to use watcher; tokens are obtained when using `watchRecall` and can be used
 *   to deregister using `unwatchRecall`
 * @property {ArchiveRecallStateWatcher} watcher a common polling watcher for all clients
 */

export default Service.extend({
  /**
   * Initialized on init.
   * @type {Map<String, ArchiveRecallStateManagerEntry>}
   */
  watchersRegistry: null,

  init() {
    this._super(...arguments);
    this.set('watchersRegistry', new Map());
  },

  /**
   * @public
   * @param {Models.File} file
   * @returns {String} token for managing registered watcher (see
   *   `ArchiveRecallStateManagerEntry`)
   */
  watchRecall(file) {
    const recallRootId = get(file, 'recallRootId');
    const watchersRegistry = this.get('watchersRegistry');
    let entry = watchersRegistry.get(recallRootId);
    let watcher;
    if (!entry) {
      entry = {
        tokens: new Set(),
        watcher: null,
      };
      watchersRegistry.set(recallRootId, entry);
    }
    if (!entry.watcher) {
      watcher = this.createWatcherObject(file);
      entry.watcher = watcher;
      entry.watcher.start();
    }
    watcher = watcher || watchersRegistry.get(recallRootId).watcher;
    const token = uuid();
    entry.tokens.add(token);
    return token;
  },

  /**
   * @public
   * @param {Models.File} file
   * @param {String} token for managing registered watcher (see
   *   `ArchiveRecallStateManagerEntry`)
   */
  unwatchRecall(file, token) {
    const recallRootId = get(file, 'recallRootId');
    if (!token) {
      throw new Error(
        'service:archive-recall-state-manager#unwatchRecall: token must not be empty'
      );
    }
    const watchersRegistry = this.get('watchersRegistry');
    const entry = watchersRegistry.get(recallRootId);
    if (!entry || !entry.tokens.has(token)) {
      return;
    }
    entry.tokens.delete(token);
    if (!entry.tokens.size) {
      if (entry.watcher) {
        entry.watcher.destroy();
      }
      watchersRegistry.delete(recallRootId);
    }
  },

  /**
   * @public
   * @param {Models.File} file
   * @returns {ArchiveRecallStateWatcher|null}
   */
  getWatcher(file) {
    const recallRootId = get(file, 'recallRootId');
    const watchersRegistry = this.get('watchersRegistry');
    const entry = watchersRegistry.get(recallRootId);
    return entry && entry.watcher || null;
  },

  /**
   * @private
   * @param {Models.File} file
   * @returns {ArchiveRecallStateWatcher}
   */
  createWatcherObject(file) {
    return ArchiveRecallStateWatcher.create({
      ownerSource: this,
      targetFile: file,
    });
  },
});
