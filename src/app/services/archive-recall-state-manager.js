import Service from '@ember/service';
import ArchiveRecallStateWatcher from 'oneprovider-gui/utils/archive-recall-state-watcher';

export default Service.extend({
  /**
   * Initialized on init.
   * @type {Map<fileId: String, {count: Number, watcher: ArchiveRecallStateWatcher}>}
   */
  watchersRegistry: null,

  init() {
    this._super(...arguments);
    this.set('watchersRegistry', new Map());
  },

  /**
   * @public
   * @param {String} fileId
   * @returns {ArchiveRecallStateWatcher}
   */
  watchRecall(fileId) {
    const watchersRegistry = this.get('watchersRegistry');
    let entry = watchersRegistry.get(fileId);
    if (!entry) {
      entry = {
        count: 0,
        watcher: null,
      };
      watchersRegistry.set(fileId, entry);
    }
    if (!entry.count || !entry.watcher) {
      entry.watcher = this.createWatcherObject(fileId);
      entry.watcher.start();
    }
    entry.count += 1;
    return entry.watcher;
  },

  /**
   * @public
   * @param {String} fileId
   */
  unwatchRecall(fileId) {
    const watchersRegistry = this.get('watchersRegistry');
    const entry = watchersRegistry.get(fileId);
    if (!entry) {
      return;
    }
    if (entry.count > 0) {
      entry.count -= 1;
      if (entry.count <= 0) {
        if (entry.watcher) {
          entry.watcher.destroy();
        }
        watchersRegistry.delete(fileId);
      }
    }
  },

  /**
   * @private
   * @param {String} fileId
   * @returns {ArchiveRecallStateWatcher}
   */
  createWatcherObject(fileId) {
    return ArchiveRecallStateWatcher.create({
      fileId,
    });
  },
});
