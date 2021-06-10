/**
 * A view component space automation aspect
 *
 * @module components/space-automation
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['space-automation'],

  i18n: service(),
  currentUser: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceAutomation',

  /**
   * @virtual
   * @type {Space}
   */
  space: undefined,

  /**
   * One of: `'waiting'`, `'ongoing'`, `'ended'`, `'create'`
   * @type {String}
   */
  activeTabId: 'waiting',

  actions: {
    changeTab(tabId) {
      this.set('activeTabId', tabId);
    },
    workflowStarted() {
      this.set('activeTabId', 'waiting');
    },
  },
});
