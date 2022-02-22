/**
 * Modal container for recall info (information about file in recalling or recalled
 * archive).
 *
 * @module components/recall-info-modal
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { equal, or, raw } from 'ember-awesome-macros';

export default Component.extend(I18n, {
  globalNotify: service(),
  archiveRecallStateManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.recallInfoModal',

  /**
   * @virtual
   * @type {Boolean}
   */
  open: false,

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual
   * @type {() => void}
   */
  onHide: notImplementedIgnore,

  showFooter: or(
    equal('processStatus', raw('pending')),
    equal('processStatus', raw('scheduled')),
  ),

  async stopRecall() {
    const {
      archiveRecallStateManager,
      file,
    } = this.getProperties('archiveRecallStateManager', 'file');
    try {
      // FIXME: implement
      throw new Error('Not implemented');
    } finally {
      try {
        await archiveRecallStateManager.updateWatcherNow(file);
      } catch (error) {
        console.log(
          'component:recall-info-modal#stopRecall: update watcher failed',
          error
        );
      }
    }
  },

  actions: {
    hide() {
      this.get('onHide')();
    },
    processStatusChanged(processStatus) {
      this.set('processStatus', processStatus);
    },
    async stopRecall() {
      try {
        await this.stopRecall();
      } catch (error) {
        this.get('globalNotify').backendError(this.t('stoppingRecall'), error);
      }
    },
  },
});
