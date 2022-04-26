import EmberObject from '@ember/object';
import Looper from 'onedata-gui-common/utils/looper';
import { bool } from 'ember-awesome-macros';

export default EmberObject.extend({
  /**
   * @virtual
   * @type {ReplacingChunksArray}
   */
  entries: undefined,

  interval: 3000,

  /**
   * @type {Looper}
   */
  looper: undefined,

  isActive: bool('looper.interval'),

  start(immediate = false) {
    const {
      looper: oldLooper,
      interval,
    } = this.getProperties('looper', 'interval');
    if (oldLooper) {
      return;
    }
    console.log('list updater start');
    const newLooper = Looper.create({
      immediate,
      interval,
    });
    newLooper.on('tick', () => {
      this.update();
    });
    this.set('looper', newLooper);
  },

  stop() {
    const looper = this.get('looper');
    if (looper) {
      console.log('list updater stop');
      looper.destroy();
      this.set('looper', null);
    }
  },

  async update() {
    return this.get('entries').scheduleReload();
  },

  /**
   * @override
   */
  destroy() {
    this._super(...arguments);
    this.stop();
  },
});
