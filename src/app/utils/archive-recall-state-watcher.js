import EmberObject, { get } from '@ember/object';
import { bool } from 'ember-awesome-macros';
import Looper from 'onedata-gui-common/utils/looper';

export default EmberObject.extend({
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
   * Created on init.
   * @type {Looper}
   */
  looper: null,

  /**
   * @type {Boolean}
   */
  isPolling: bool('looper'),

  /**
   * When `'state'` - poll for state and reload info only if needed.
   * When `'info'` - poll only for info.
   * Normally 'state' pollingMode should be used, but when state is not available (eg. because
   * we are on another provider and does not have access to progress) we can fall back to
   * polling only info (watch `finishTime` changes).
   * @type {'state'|'info'}
   */
  pollingMode: 'state',

  /**
   * @override
   */
  destroy() {
    this._super(...arguments);
    this.stop();
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
      this.stop();
      return;
    }
    isFinished = get(info, 'finishTimestamp');
    if (isFinished) {
      this.stop();
      return;
    }
    if (pollingMode === 'state') {
      try {
        state = await this.reloadState();
        isFinished = isFinished || get(state, 'currentBytes') >= get(info, 'targetBytes');
      } catch (reloadStateError) {
        pollingMode = this.set('pollingMode', 'info');
      }
    }

    if (pollingMode === 'state') {
      shouldUpdateInfo = (
        !get(info, 'startTimestamp') && get(state, 'currentBytes')
      ) || isFinished;
    } else if (pollingMode === 'info') {
      shouldUpdateInfo = true;
    }
    if (shouldUpdateInfo) {
      try {
        await this.reloadInfo();
      } catch (reloadInfoError) {
        this.stop();
        return;
      }
    }
    if (isFinished) {
      this.stop();
    }
  },

  async getInfo() {
    return this.get('targetFile.archiveRecallInfo.content') ||
      this.get('targetFile').getRelation('archiveRecallInfo');
  },

  reloadInfo() {
    return this.get('targetFile').belongsTo('archiveRecallInfo').reload();
  },

  reloadState() {
    return this.get('targetFile').belongsTo('archiveRecallState').reload();
  },
});
