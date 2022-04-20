import EmberObject from '@ember/object';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';

export default EmberObject.extend({
  /**
   * @virtual
   * @type {ReplacingChunksArray}
   */
  replacingChunksArray: undefined,

  //#region state

  /**
   * @type {boolean}
   */
  next: false,

  /**
   * @type {boolean}
   */
  prev: false,

  //#endregion

  init() {
    this._super(...arguments);
    this.bindLoadingStateNotifications(this.get('replacingChunksArray'));
  },

  /**
   * @public
   * @param {ReplacingChunksArray} array
   */
  bindLoadingStateNotifications(array) {
    array.on('fetchPrevStarted', () => this.updateFetchStatus('prev', true));
    array.on('fetchPrevResolved', () => this.updateFetchStatus('prev', false));
    array.on('fetchPrevRejected', () => this.updateFetchStatus('prev', false));
    array.on('fetchNextStarted', () => this.updateFetchStatus('next', true));
    array.on('fetchNextResolved', () => this.updateFetchStatus('next', false));
    array.on('fetchNextRejected', () => this.updateFetchStatus('next', false));
  },

  /**
   * @private
   * @param {'prev'|'next'} fetchArraySide
   * @param {boolean} isLoading
   * @returns {undefined}
   */
  updateFetchStatus(fetchArraySide, isLoading) {
    safeExec(this, 'set', fetchArraySide, isLoading);
  },
});
