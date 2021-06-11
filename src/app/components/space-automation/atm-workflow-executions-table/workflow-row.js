/**
 * Shows single workflow executions table row.
 *
 * @module components/space-automation/atm-workflow-executions-table/workflow-row
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  classNames: ['workflow-row'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceAutomation.atmWorkflowExecutionsTable.workflowRow',

  /**
   * @virtual
   * @type {Models.AtmWorkflowExecution}
   */
  atmWorkflowExecution: undefined,

  /**
   * @virtual
   * @type {Array<String>}
   */
  columns: undefined,

  /**
   * @type {String}
   */
  timeFormat: 'D MMM YYYY H:mm:ss',

  /**
   * @type {ComputedProperty<String>}
   */
  statusIcon: computed('atmWorkflowExecution.status', function statusIcon() {
    switch (this.get('atmWorkflowExecution.status')) {
      case 'scheduled':
      case 'preparing':
      case 'enqueued':
        return 'time';
      case 'active':
        return 'update';
      case 'finished':
        return 'checkbox-filled';
      case 'failed':
        return 'checkbox-filled-x';
    }
  }),

  /**
   * @type {ComputedProperty<String>}
   */
  statusTooltip: computed('atmWorkflowExecution.status', function statusTooltip() {
    const status = this.get('atmWorkflowExecution.status');
    if (status) {
      return this.t(`statuses.${status}`, {}, { defaultValue: '' });
    }
  }),
});
