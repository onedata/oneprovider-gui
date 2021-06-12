/**
 * Provides backend functions related to workflows and inventories.
 *
 * @module services/workflow-manager
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { getProperties, get } from '@ember/object';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { allSettled } from 'rsvp';

export default Service.extend({
  store: service(),
  onedataGraph: service(),

  /**
   * @param {String} atmWorkflowSchemaId
   * @param {String} spaceId
   * @param {Object} storeInitialValues map (storeSchemaId => initial value)
   * @returns {Promise<Models.AtmWorkflowExecution>}
   */
  async runWorkflow(atmWorkflowSchemaId, spaceId, storeInitialValues) {
    return await this.get('store').createRecord('atmWorkflowExecution', {
      _meta: {
        additionalData: {
          atmWorkflowSchemaId,
          spaceId,
          storeInitialValues,
        },
      },
    }).save();
  },

  /**
   * @param {Models.Space} space
   * @param {String} phase one of: `'waiting'`, `'ongoing'`, `'ended'`
   * @param {string} startFromIndex
   * @param {number} limit
   * @param {number} offset
   * @returns {Promise<{array: Array<Models.AtmWorkflowExecution>, isLast: Boolean}>}
   */
  async getAtmWorkflowExecutionsForSpace(
    space, phase, startFromIndex, limit, offset
  ) {
    const onedataGraph = this.get('onedataGraph');
    const {
      entityType,
      entityId,
    } = getProperties(space, 'entityType', 'entityId');
    const armWorkflowExecutionsGri = gri({
      entityType,
      entityId,
      aspect: 'atm_workflow_execution_details',
    });
    if (!limit || limit <= 0) {
      return { array: [], isLast: false };
    }
    const { atmWorlfowExecutions, isLast } = await onedataGraph.request({
      gri: armWorkflowExecutionsGri,
      operation: 'get',
      data: {
        phase,
        index: startFromIndex,
        offset,
        limit,
      },
      subscribe: false,
    });
    const atmWorkflowExecutionsRecords =
      await this.pushAtmWorkflowExecutionsToStore(atmWorlfowExecutions);
    await allSettled(
      atmWorkflowExecutionsRecords.map(record => get(record, 'atmWorkflowSchemaSnapshot'))
    );
    return { array: atmWorkflowExecutionsRecords, isLast };
  },

  async pushAtmWorkflowExecutionsToStore(atmWorkflowExecutionsAttrs) {
    const store = this.get('store');
    return atmWorkflowExecutionsAttrs.map(atmWorkflowExecutionAttrs => {
      const modelData =
        store.normalize('atmWorkflowExecution', atmWorkflowExecutionAttrs);
      return store.push(modelData);
    });
  },
});
