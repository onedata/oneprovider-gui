/**
 * Shows events related to specific task execution pod.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2021-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/i18n';

export default Component.extend(I18n, {
  classNames: ['events-table'],

  workflowManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.modals.atmTaskExecutionPodsActivityModal.eventsTable',

  /**
   * @virtual
   * @type {string}
   */
  atmTaskExecutionId: undefined,

  /**
   * @virtual
   * @type {string}
   */
  podId: undefined,

  /**
   * @type {ComputedProperty<Array<AuditLogBrowserCustomColumnHeader>>}
   */
  customColumnHeaders: computed(function customColumnHeaders() {
    return ['type', 'reason', 'message'].map((colName) => ({
      classNames: `${colName}-column-header`,
      content: this.t(`columnLabels.${colName}`),
    }));
  }),

  /**
   * @type {ComputedProperty<(listingParams: AuditLogListingParams) => Promise<AuditLogEntriesPage<OpenfaasFunctionEvent>>>}
   */
  fetchLogEntriesCallback: computed(
    'atmTaskExecutionId',
    'podId',
    function fetchLogEntriesCallback() {
      const {
        atmTaskExecutionId,
        podId,
        workflowManager,
      } = this.getProperties(
        'atmTaskExecutionId',
        'podId',
        'workflowManager'
      );
      return (listingParams) => workflowManager.getAtmTaskExecutionOpenfaasPodEventLogs(
        atmTaskExecutionId,
        podId,
        listingParams
      );
    }
  ),
});
