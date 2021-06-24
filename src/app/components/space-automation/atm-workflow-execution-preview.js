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
import StatsFetcher from 'oneprovider-gui/utils/workflow-visualiser/stats-fetcher';

export default Component.extend({
  classNames: ['atm-workflow-execution-preview', 'loadable-row'],

  /**
   * @virtual
   * @type {PromiseObject<Models.AtmWorkflowExecution>}
   */
  atmWorkflowExecutionProxy: undefined,

  /**
   * @type {ComputedProperty<PromiseObject<Models.AtmWorkflowSchemaSnapshot>>}
   */
  atmWorkflowSchemaSnapshotProxy: promise.object(computed(
    'atmWorkflowExecutionProxy',
    async function atmWorkflowSchemaSnapshotProxy() {
      return await get(
        await this.get('atmWorkflowExecutionProxy'),
        'atmWorkflowSchemaSnapshot'
      );
    }
  )),

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

  /**
   * @type {ComputedProperty<Utils.WorkflowVisualiser.StatsFetcher>}
   */
  statsFetcher: computed(
    'atmWorkflowExecutionProxy.isFulfilled',
    function statsFetcher() {
      const {
        isFulfilled,
        content: atmWorkflowExecution,
      } = getProperties(this.get('atmWorkflowExecutionProxy'), 'isFulfilled', 'content');

      if (isFulfilled) {
        return StatsFetcher.create({
          ownerSource: this,
          atmWorkflowExecution,
        });
      }
    }
  ),
});
