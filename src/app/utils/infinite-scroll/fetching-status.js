/**
 * Exposes a state of spinners that indicates current fetching operation (eg. fetching
 * next chunk). It registers for replacing chunks array events.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { get } from '@ember/object';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { camelize } from '@ember/string';

export default EmberObject.extend({
  /**
   * @virtual
   * @type {ReplacingChunksArray}
   */
  entries: undefined,

  //#region public state

  /**
   * @type {boolean}
   */
  isFetchingNext: false,

  /**
   * @type {boolean}
   */
  isFetchingPrev: false,

  //#endregion

  //#region private state

  /**
   * Handlers for array events. Generated by `createUpdateStatusHandlers`.
   * @type {Object}
   */
  handlers: undefined,

  //#endregion

  handlersBindingMapping: Object.freeze({
    fetchPrevStarted: 'onFetchPrevStarted',
    fetchPrevResolved: 'onFetchPrevResolved',
    fetchPrevRejected: 'onFetchPrevRejected',
    fetchNextStarted: 'onFetchNextStarted',
    fetchNextResolved: 'onFetchNextResolved',
    fetchNextRejected: 'onFetchNextRejected',
  }),

  init() {
    this._super(...arguments);
    this.createUpdateStatusHandlers();
    this.bindLoadingStateNotifications();
  },

  /**
   * @override
   */
  destroy() {
    try {
      this.unbindLoadingStateNotifications();
    } finally {
      this._super(...arguments);
    }
  },

  /**
   * @public
   */
  bindLoadingStateNotifications() {
    this.toggleNotificationsBindings(true);
  },

  /**
   * @public
   */
  unbindLoadingStateNotifications() {
    this.toggleNotificationsBindings(false);
  },

  /**
   * @param {boolean} bind if true - bind events, if false unbind events
   */
  toggleNotificationsBindings(bind) {
    const {
      handlersBindingMapping,
      handlers,
      entries,
    } = this.getProperties('handlersBindingMapping', 'handlers', 'entries');
    for (const eventName in handlersBindingMapping) {
      const handler = get(handlers, handlersBindingMapping[eventName]);
      entries[bind ? 'on' : 'off'](eventName, handler);
    }
  },

  /**
   * @private
   * @param {'prev'|'next'} fetchArraySide
   * @param {boolean} isLoading
   * @returns {undefined}
   */
  updateFetchStatus(fetchArraySide, isLoading) {
    safeExec(this, 'set', this.fetchSideToStatus(fetchArraySide), isLoading);
  },

  /**
   * @param {'prev'|'next'} fetchArraySide
   * @returns {string} property name indicating fetch status
   */
  fetchSideToStatus(fetchArraySide) {
    return camelize(`is-fetching-${fetchArraySide}`);
  },

  /**
   * @private
   */
  createUpdateStatusHandlers() {
    this.set('handlers', {
      onFetchPrevStarted: () => this.updateFetchStatus('prev', true),
      onFetchPrevResolved: () => this.updateFetchStatus('prev', false),
      onFetchPrevRejected: () => this.updateFetchStatus('prev', false),
      onFetchNextStarted: () => this.updateFetchStatus('next', true),
      onFetchNextResolved: () => this.updateFetchStatus('next', false),
      onFetchNextRejected: () => this.updateFetchStatus('next', false),
    });
  },
});
