/**
 * Polls for download status for given download code and notify listeners about the state
 * change. Has timeout support (download not starting for given time) and stops itself
 * when the download is finished (either done or failed).
 *
 * @author Jakub Liput
 * @copyright (C) 2026 Onedata (onedata.org)
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { RawFileDownloadState } from 'oneprovider-gui/services/production/file-manager';
import _ from 'lodash';
import Looper from 'onedata-gui-common/utils/looper';
import isNotFoundError from './is-not-found-error';

/**
 * @type {(state: FileDownloadState) => void} DownloadStatusListener
 */

/**
 * When the status is reported as "pending" longer than this time (in milliseconds),
 * notify download failure and stop the monitor.
 * @type {number}
 */
const timeout = 60 * 1000;

/**
 * Polling interval time in milliseconds.
 * @type {number}
 */
const interval = 1 * 1000;

export const FileDownloadState = Object.freeze({
  ...RawFileDownloadState,
  Init: 'init',
  Completed: 'completed',
});

export default class DownloadStatusMonitor {
  #timeoutTimer = null;
  #error = null;
  #state = FileDownloadState.Init;
  #listeners = [];
  #fileManager;
  #downloadCode;

  /**
   * @param {string} downloadCode
   */
  constructor(fileManager, downloadCode) {
    if (!fileManager || !downloadCode) {
      throw new Error(
        'DownloadStatusMonitor: fileManager and downloadCode must be provided in constructor'
      );
    }
    this.#fileManager = fileManager;
    this.#downloadCode = downloadCode;
    this.#timeoutTimer = setTimeout(() => {
      this.setState(FileDownloadState.Failed, { id: 'timeout' });
    }, timeout);
    this.looper = Looper.create({
      interval,
    });
    this.looper.on('tick', () => this.fetchState());
    this.looper.notify();
  }

  get state() {
    return this.#state;
  }

  get error() {
    return this.#error;
  }

  get downloadCode() {
    return this.#downloadCode;
  }

  /**
   * @public
   * @param {DownloadStatusListener} listener
   */
  addListener(listener) {
    this.#listeners.push(listener);
  }

  /**
   * @public
   * @param {DownloadStatusListener} listener
   */
  removeListener(listener) {
    _.remove(this.#listeners, listener);
  }

  /**
   * @public
   */
  destroy() {
    this.looper?.destroy();
  }

  /**
   * @private
   */
  async fetchState() {
    try {
      const {
        status,
        error,
      } = await this.#fileManager.getDownloadStatus(this.#downloadCode);
      this.setState(status, error);
    } catch (error) {
      if (isNotFoundError(error)) {
        this.setState(FileDownloadState.Completed);
      } else {
        this.setState(FileDownloadState.Failed, error);
      }
    }
  }

  /**
   * @private
   * @param {FileDownloadState} newState
   * @param {any} error
   */
  setState(newState, error) {
    if (newState === FileDownloadState.Started) {
      this.cancelTimeoutTimer();
    }
    if (
      newState === FileDownloadState.Unknown ||
      newState === FileDownloadState.Failed ||
      newState === FileDownloadState.Completed
    ) {
      this.cancelTimeoutTimer();
      this.terminateStatusPolling();
    }
    if (newState === FileDownloadState.Failed && error) {
      this.#error = error;
    }
    this.#state = newState;
    this.notify();
  }

  /**
   * @private
   */
  cancelTimeoutTimer() {
    if (this.#timeoutTimer) {
      clearTimeout(this.#timeoutTimer);
      this.#timeoutTimer = null;
    }
  }

  /**
   * @private
   */
  terminateStatusPolling() {
    if (this.looper) {
      this.looper.destroy();
      this.looper = null;
    }
  }

  /**
   * @private
   */
  notify() {
    for (const listener of this.#listeners) {
      listener(this.#state, this.#error);
    }
  }
}
