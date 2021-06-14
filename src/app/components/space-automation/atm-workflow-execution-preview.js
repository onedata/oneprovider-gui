/**
 * Shows workflow execution progress using full workflow visualiser.
 *
 * @module components/space-automation/atm-workflow-execution-preview
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get, getProperties } from '@ember/object';
import { promise } from 'ember-awesome-macros';

export default Component.extend({
  classNames: ['atm-workflow-execution-preview', 'loadable-row'],

  /**
   * @virtual
   * @type {Models.AtmWorkflowExecutionSummary}
   */
  atmWorkflowExecutionSummary: undefined,

  /**
   * @type {ComputedProperty<PromiseObject<Models.AtmWorkflowExecution>>}
   */
  atmWorkflowExecutionProxy: promise.object(
    computed('atmWorkflowExecutionSummary', async function atmWorkflowExecution() {
      return await get(
        this.get('atmWorkflowExecutionSummary'),
        'atmWorkflowExecution'
      );
    })
  ),

  /**
   * @type {ComputedProperty<PromiseObject<Models.AtmWorkflowSchemaSnapshot>>}
   */
  atmWorkflowSchemaSnapshotProxy: promise.object(
    computed('atmWorkflowExecutionProxy', async function atmWorkflowSchemaSnapshot() {
      return await get(
        await this.get('atmWorkflowExecutionProxy'),
        'atmWorkflowSchemaSnapshot'
      );
    })
  ),

  /**
   * @type {ComputedProperty<PromiseObject>}
   */
  initialLoadingProxy: promise.object(promise.all(
    'atmWorkflowExecutionProxy',
    'atmWorkflowSchemaSnapshotProxy'
  )),

  /**
   * @type {ComputedProperty<Object>}
   */
  rawSchema: computed(
    'atmWorkflowSchemaSnapshotProxy.content.{lanes,stores}',
    function rawSchema() {
      const {
        isFulfilled,
        lanes,
        stores,
      } = getProperties(
        this.get('atmWorkflowSchemaSnapshotProxy'),
        'isFulfilled',
        'lanes',
        'stores'
      );
      if (isFulfilled) {
        return {
          lanes,
          stores,
        };
      }
    }
  ),
});
