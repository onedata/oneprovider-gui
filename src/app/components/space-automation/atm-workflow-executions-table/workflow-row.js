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
import computedPipe from 'onedata-gui-common/utils/ember/computed-pipe';
import moment from 'moment';

const timeFormat = 'D MMM YYYY H:mm:ss';

export default Component.extend(I18n, {
  tagName: 'tr',
  classNames: ['workflow-row', 'data-row'],
  attributeBindings: ['atmWorkflowExecutionSummary.entityId:data-row-id'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceAutomation.atmWorkflowExecutionsTable.workflowRow',

  /**
   * @virtual
   * @type {Models.AtmWorkflowExecutionSummary}
   */
  atmWorkflowExecutionSummary: undefined,

  /**
   * @virtual
   * @type {Array<String>}
   */
  columns: undefined,

  /**
   * @virtual
   * @type {Function}
   * @param {Models.AtmWorkflowExecutionSummary}
   * @returns {any}
   */
  onSelect: undefined,

  /**
   * @type {ComputedProperty<String>}
   */
  statusIcon: computed('atmWorkflowExecutionSummary.status', function statusIcon() {
    switch (this.get('atmWorkflowExecutionSummary.status')) {
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
  statusTooltip: computed(
    'atmWorkflowExecutionSummary.status',
    function statusTooltip() {
      const status = this.get('atmWorkflowExecutionSummary.status');
      if (status) {
        return this.t(`statuses.${status}`, {}, { defaultValue: '' });
      }
    }
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  scheduledAtReadable: computedPipe(
    'atmWorkflowExecutionSummary.scheduleTime',
    timeReadable
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  startedAtReadable: computedPipe(
    'atmWorkflowExecutionSummary.startTime',
    timeReadable
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  finishedAtReadable: computedPipe(
    'atmWorkflowExecutionSummary.finishTime',
    timeReadable
  ),

  click() {
    this._super(...arguments);
    this.notifyAboutSelection();
  },

  notifyAboutSelection() {
    const {
      atmWorkflowExecutionSummary,
      onSelect,
    } = this.getProperties('atmWorkflowExecutionSummary', 'onSelect');
    onSelect && onSelect(atmWorkflowExecutionSummary);
  },
});

function timeReadable(timestamp) {
  return (timestamp && moment.unix(timestamp).format(timeFormat)) || '‐';
}
