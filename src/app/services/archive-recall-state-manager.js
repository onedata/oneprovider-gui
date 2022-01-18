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
    if (!entry) {
      entry = {
        tokens: new Set(),
        watcher: null,
      };
      watchersRegistry.set(recallRootId, entry);
    }
    if (!entry.tokens.size || !entry.watcher) {
      entry.watcher = this.createWatcherObject(file);
      entry.watcher.start();
    }
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
   * @private
   * @param {Models.File} file
   * @returns {ArchiveRecallStateWatcher}
   */
  createWatcherObject(file) {
    return ArchiveRecallStateWatcher.create({
      targetFile: file,
    });
  },
});
