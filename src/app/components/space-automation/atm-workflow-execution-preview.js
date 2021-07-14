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
import { collect } from '@ember/object/computed';
import ExecutionDataFetcher from 'oneprovider-gui/utils/workflow-visualiser/execution-data-fetcher';
import { workflowEndedStatuses } from 'onedata-gui-common/utils/workflow-visualiser/statuses';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  classNames: ['atm-workflow-execution-preview', 'loadable-row'],

  workflowManager: service(),
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceAutomation.atmWorkflowExecutionPreview',

  /**
   * @virtual
   * @type {PromiseObject<Models.AtmWorkflowExecution>}
   */
  atmWorkflowExecutionProxy: undefined,

  wasCancelledByUser: false,

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
   * @type {ComputedProperty<Utils.WorkflowVisualiser.ExecutionDataFetcher>}
   */
  executionDataFetcher: computed(
    'atmWorkflowExecutionProxy.isFulfilled',
    function executionDataFetcher() {
      const {
        isFulfilled,
        content: atmWorkflowExecution,
      } = getProperties(this.get('atmWorkflowExecutionProxy'), 'isFulfilled', 'content');

      if (isFulfilled) {
        return ExecutionDataFetcher.create({
          ownerSource: this,
          atmWorkflowExecution,
        });
      }
    }
  ),

  /**
   * @type {ComputedProperty<Utils.Action>}
   */
  cancelAction: computed(
    'atmWorkflowExecutionProxy.status',
    'wasCancelledByUser',
    function cancelAction() {
      const status = this.get('atmWorkflowExecutionProxy.status');
      const wasCancelledByUser = this.get('wasCancelledByUser');
      const disabled = wasCancelledByUser || [
        'aborting',
        ...workflowEndedStatuses,
      ].includes(status);
      return {
        title: this.t('cancel'),
        class: 'cancel-atm-workflow-execution-action-trigger',
        icon: 'cancelled',
        buttonStyle: 'danger',
        disabled,
        action: () => this.cancelAtmWorkflowExecution(),
      };
    }
  ),

  /**
   * @type {ComputedProperty<Array<Utils.Action>>}
   */
  workflowActions: collect('cancelAction'),

  async cancelAtmWorkflowExecution() {
    this.set('wasCancelledByUser', true);
    const atmWorkflowExecutionId = this.get('atmWorkflowExecutionProxy.entityId');
    await this.get('workflowManager').cancelAtmWorkflowExecution(atmWorkflowExecutionId);
  },
});
