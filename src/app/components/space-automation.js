/**
 * A view component for space automation aspect
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
  classNames: ['space-automation', 'fill-flex-using-column'],

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
   * One of: `'waiting'`, `'ongoing'`, `'ended'`, `'create'`, `'preview'`
   * @type {String}
   */
  activeTabId: 'waiting',

  /**
   * @type {Object}
   */
  tabIcons: Object.freeze({
    create: 'play',
  }),

  /**
   * @type {Models.atmWorkflowExecutionSummary}
   */
  atmWorkflowExecutionSummaryForPreview: undefined,

  changeTab(tabId) {
    this.set('activeTabId', tabId);
  },

  actions: {
    changeTab(tabId) {
      this.changeTab(tabId);
    },
    workflowStarted() {
      this.changeTab('waiting');
    },
    workflowSelected(atmWorkflowExecutionSummary) {
      this.set('atmWorkflowExecutionSummaryForPreview', atmWorkflowExecutionSummary);
      this.changeTab('preview');
    },
    closeWorkflowPreview() {
      if (this.get('activeTabId') === 'preview') {
        this.changeTab('waiting');
      }
      this.set('atmWorkflowExecutionSummaryForPreview', null);
    },
  },
});