/**
 * Shows workflow execution progress using full workflow visualiser.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get, getProperties } from '@ember/object';
import { promise } from 'ember-awesome-macros';
import ExecutionDataFetcher from 'oneprovider-gui/utils/workflow-visualiser/execution-data-fetcher';
import ActionsFactory from 'onedata-gui-common/utils/workflow-visualiser/actions-factory';
import { inject as service } from '@ember/service';
import { hash as hashFulfilled } from 'rsvp';

export default Component.extend({
  classNames: ['atm-workflow-execution-preview', 'loadable-row'],

  workflowManager: service(),
  workflowActions: service(),
  modalManager: service(),

  /**
   * @virtual
   * @type {PromiseObject<Models.AtmWorkflowExecution>}
   */
  atmWorkflowExecutionProxy: undefined,

  /**
   * @virtual
   * @type {() => void}
   */
  onClose: undefined,

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
   * @type {ComputedProperty<PromiseObject<Object<string,Models.AtmLambdaSnapshot>>>}
   */
  usedLambdasMapProxy: promise.object(computed(
    'atmWorkflowExecutionProxy',
    async function usedLambdasMapProxy() {
      const {
        atmWorkflowExecutionProxy,
        workflowManager,
      } = this.getProperties('atmWorkflowExecutionProxy', 'workflowManager');
      const lambdaSnapshotRegistry = get(
        await atmWorkflowExecutionProxy,
        'lambdaSnapshotRegistry'
      );

      if (!lambdaSnapshotRegistry) {
        return {};
      }

      const lambdaPromisesHash = Object.keys(lambdaSnapshotRegistry)
        .reduce((acc, lambdaId) => {
          acc[lambdaId] = workflowManager.getAtmLambdaSnapshotById(
            lambdaSnapshotRegistry[lambdaId]
          );
          return acc;
        }, {});

      return hashFulfilled(lambdaPromisesHash);
    }
  )),

  /**
   * @type {ComputedProperty<PromiseObject>}
   */
  initialLoadingProxy: promise.object(promise.all(
    'atmWorkflowExecutionProxy',
    'atmWorkflowSchemaSnapshotProxy',
    'usedLambdasMapProxy'
  )),

  /**
   * @type {ComputedProperty<Object>}
   */
  rawSchema: computed(
    'atmWorkflowSchemaSnapshotProxy.revisionRegistry',
    function rawSchema() {
      const name = this.get('atmWorkflowSchemaSnapshotProxy.name');
      const revisionRegistry =
        this.get('atmWorkflowSchemaSnapshotProxy.revisionRegistry');
      const revision = Object.values(revisionRegistry || {})[0];
      if (revision) {
        return {
          name: name,
          ...getProperties(
            revision,
            'lanes',
            'stores',
            'dashboardSpec'
          ),
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
   * @type {ComputedProperty<Utils.WorkflowVisualiser.ActionsFactory>}
   */
  actionsFactory: computed(function actionsFactory() {
    const modalManager = this.get('modalManager');
    const factory = ActionsFactory.create({ ownerSource: this });
    factory.setRetryLaneCallback(async (lane, runNumber) =>
      await this.get('workflowManager').retryAtmLane(
        this.get('atmWorkflowExecutionProxy.entityId'),
        lane.positionInParent,
        runNumber
      ));
    factory.setRerunLaneCallback(async (lane, runNumber) =>
      await this.get('workflowManager').rerunAtmLane(
        this.get('atmWorkflowExecutionProxy.entityId'),
        lane.positionInParent,
        runNumber
      ));
    factory.setShowTaskPodsActivityCallback((task) => {
      const {
        name,
        instanceId,
      } = getProperties(task, 'name', 'instanceId');
      return modalManager.show('atm-task-execution-pods-activity-modal', {
        atmTaskName: name,
        atmTaskExecutionId: instanceId,
      }).hiddenPromise;
    });
    return factory;
  }),

  /**
   * @type {ComputedProperty<Utils.Action>}
   */
  cancelAction: computed(
    'atmWorkflowExecutionProxy.isFulfilled',
    function cancelAction() {
      if (this.atmWorkflowExecutionProxy.isFulfilled) {
        return this.workflowActions.createCancelAtmWorkflowExecutionAction({
          atmWorkflowExecution: this.atmWorkflowExecutionProxy.content,
        });
      }
    }
  ),

  /**
   * @type {ComputedProperty<Utils.Action>}
   */
  forceContinueAction: computed(
    'atmWorkflowExecutionProxy.isFulfilled',
    function forceContinueAction() {
      if (this.atmWorkflowExecutionProxy.isFulfilled) {
        return this.workflowActions.createForceContinueAtmWorkflowExecutionAction({
          atmWorkflowExecution: this.atmWorkflowExecutionProxy.content,
        });
      }
    }
  ),

  /**
   * @type {ComputedProperty<Utils.Action>}
   */
  pauseResumeAction: computed(
    'atmWorkflowExecutionProxy.isFulfilled',
    function pauseResumeAction() {
      if (this.atmWorkflowExecutionProxy.isFulfilled) {
        return this.workflowActions.createPauseResumeAtmWorkflowExecutionAction({
          atmWorkflowExecution: this.atmWorkflowExecutionProxy.content,
        });
      }
    }
  ),

  /**
   * @type {ComputedProperty<Utils.Action>}
   */
  removeAction: computed(
    'atmWorkflowExecutionProxy.isFulfilled',
    function removeAction() {
      if (this.atmWorkflowExecutionProxy.isFulfilled) {
        const action = this.workflowActions.createRemoveAtmWorkflowExecutionAction({
          atmWorkflowExecution: this.atmWorkflowExecutionProxy.content,
        });
        action.addExecuteHook((result) => {
          if (result?.status === 'done') {
            this.onClose?.();
          }
        });
        return action;
      }
    }
  ),
});
