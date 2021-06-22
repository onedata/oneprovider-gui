/**
 * Real implementation of workflow execution statistics fetcher.
 *
 * @module utils/workflow-visualiser/stats-fetcher
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import StatsFetcher from 'onedata-gui-common/utils/workflow-visualiser/stats-fetcher';
import { get, getProperties } from '@ember/object';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { inject as service } from '@ember/service';
import _ from 'lodash';
import { all as allFulfilled } from 'rsvp';

export default StatsFetcher.extend(OwnerInjector, {
  workflowManager: service(),

  /**
   * @virtual
   * @type {Models.AtmWorkflowExecution}
   */
  atmWorkflowExecution: undefined,

  /**
   * @override
   */
  async fetchStatuses() {
    const {
      atmWorkflowExecution,
      workflowManager,
    } = this.getProperties('atmWorkflowExecution', 'workflowManager');
    await atmWorkflowExecution.reload();

    const lanes = get(atmWorkflowExecution, 'lanes');
    const parallelBoxes = _.flatten(lanes.mapBy('parallelBoxes'));
    const taskIds = _.flatten(parallelBoxes.mapBy('taskRegistry')
      .map(taskRegistry => Object.values(taskRegistry))
    );
    const taskExecutionRecords = await allFulfilled(
      taskIds.map(taskId => workflowManager.getAtmTaskExecutionById(taskId))
    );

    return {
      global: {
        status: get(atmWorkflowExecution, 'status'),
      },
      lane: lanes.reduce((laneStatuses, { schemaId, status }) => {
        laneStatuses[schemaId] = { status };
        return laneStatuses;
      }, {}),
      parallelBox: parallelBoxes.reduce((parallelBoxStatuses, { schemaId, status }) => {
        parallelBoxStatuses[schemaId] = { status };
        return parallelBoxStatuses;
      }, {}),
      task: taskExecutionRecords.reduce((taskStatuses, taskExecutionRecord) => {
        taskStatuses[get(taskExecutionRecord, 'schemaId')] = getProperties(
          taskExecutionRecord,
          'status',
          'itemsInProcessing',
          'itemsProcessed',
          'itemsFailed'
        );
        return taskStatuses;
      }, {}),
    };
  },
});
