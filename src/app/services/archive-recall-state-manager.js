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
 * @copyright (C) 2022-2023 ACK CYFRONET AGH
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
  //#region configuration

  // TODO: VFS-11462 leaving a directory being recalled always causes parent directory
  // to be unwatched, so there is always error on unwatching - enable `areWarningsFatal`
  // when this will be fixed
  // areWarningsFatal: config.environment !== 'production',
  areWarningsFatal: false,

  //#endregion

  //#region state

  /**
   * Initialized on init.
   * Maps: recall root ID (File ID) -> ArchiveRecallStateManagerEntry
   * @type {Map<string, ArchiveRecallStateManagerEntry>}
   */
  watchersRegistry: null,

  //#endregion

  init() {
    this._super(...arguments);
    this.set('watchersRegistry', new Map());
  },

  /**
   * The `file` must have an `archiveRecallRootFileId` property requirement.
   * @public
   * @param {Models.File} file
   * @returns {string|undefined} Token for managing registered watcher (see
   *   `ArchiveRecallStateManagerEntry`) or `undefined` if the file cannot be registered.
   */
  watchRecall(file) {
    if (!this.assertValidFile(file, 'watchRecall')) {
      return;
    }
    const archiveRecallRootFileId = get(file, 'archiveRecallRootFileId');
    const watchersRegistry = this.get('watchersRegistry');
    let entry = watchersRegistry.get(archiveRecallRootFileId);
    let watcher;
    if (!entry) {
      entry = {
        tokens: new Set(),
        watcher: null,
      };
      watchersRegistry.set(archiveRecallRootFileId, entry);
    }
    if (!entry.watcher) {
      watcher = this.createWatcherObject(file);
      entry.watcher = watcher;
      entry.watcher.start();
    }
    watcher = watcher || watchersRegistry.get(archiveRecallRootFileId).watcher;
    const token = uuid();
    entry.tokens.add(token);
    return token;
  },

  /**
   * @public
   * @param {Models.File} file
   * @param {string} token Token for managing registered watcher (see
   *   `ArchiveRecallStateManagerEntry`)
   */
  unwatchRecall(file, token) {
    if (!this.assertValidFile(file, 'watchRecall')) {
      return;
    }
    const archiveRecallRootFileId = get(file, 'archiveRecallRootFileId');
    if (!token) {
      throw new Error(
        'service:archive-recall-state-manager#unwatchRecall: token must not be empty'
      );
    }
    const watchersRegistry = this.get('watchersRegistry');
    const entry = watchersRegistry.get(archiveRecallRootFileId);
    if (!entry || !entry.tokens.has(token)) {
      return;
    }
    entry.tokens.delete(token);
    if (!entry.tokens.size) {
      if (entry.watcher) {
        entry.watcher.destroy();
      }
      watchersRegistry.delete(archiveRecallRootFileId);
    }
  },

  /**
   * @public
   * @param {Models.File} file
   * @returns {ArchiveRecallStateWatcher|null}
   */
  getWatcher(file) {
    const archiveRecallRootFileId = get(file, 'archiveRecallRootFileId');
    const watchersRegistry = this.get('watchersRegistry');
    const entry = watchersRegistry.get(archiveRecallRootFileId);
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

  /**
   * @private
   * @param {Models.File} file
   * @param {string} operationName
   * @returns {boolean}
   */
  assertValidFile(file, operationName) {
    if (!get(file, 'archiveRecallRootFileId')) {
      const message =
        `Tried to invoke "${operationName}" with a file without archiveRecallRootFileId, ignoring. You may have forgotten to add the "archiveRecallRootFileId" property requirement to file or try to operate on the file that is not recalled.`;
      if (this.areWarningsFatal) {
        throw new Error(message);
      } else {
        console.warn(message);
      }
      return false;
    }
    return true;
  },
});
