/**
 * Renders full "run workflow" wizard
 *
 * @module components/space-automation/run-workflow-creator
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';

export default Component.extend(I18n, {
  classNames: ['run-workflow-creator'],

  i18n: service(),
  currentUser: service(),
  globalNotify: service(),
  workflowManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceAutomation.runWorkflowCreator',

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual optional
   * @type {Function}
   * @param {Models.AtmWorkflowExecution} atmWorkflowExecution
   * @returns {any}
   */
  onWorkflowStarted: undefined,

  /**
   * One of: `'list'`, `'inputStores'`
   * @type {String}
   */
  activeSlide: 'list',

  /**
   * @type {Models.AtmWorkflowSchema}
   */
  selectedAtmWorkflowSchema: undefined,

  /**
   * Data from input-stores-form
   * @type {Object}
   */
  inputStoresData: undefined,

  /**
   * True if data form input-stores-form is valid
   * @type {Object}
   */
  areInputStoresValid: true,

  /**
   * @type {Boolean}
   */
  isStartingWorkflow: false,

  /**
   * @type {ComputedProperty<PromiseObject>}
   */
  userProxy: reads('currentUser.userProxy'),

  /**
   * @type {ComputedProperty<Models.User>}
   */
  user: reads('userProxy.content'),

  changeSlide(newSlideId) {
    this.set('activeSlide', newSlideId);
  },

  actions: {
    atmWorkflowSchemaSelected(atmWorkflowSchema) {
      this.setProperties({
        selectedAtmWorkflowSchema: atmWorkflowSchema,
        activeSlide: 'inputStores',
      });
    },
    inputStoresChanged({ data, isValid }) {
      this.setProperties({
        inputStoresData: data,
        areInputStoresValid: isValid,
      });
    },
    async runWorkflow() {
      this.set('isStartingWorkflow', true);
      const {
        workflowManager,
        space,
        selectedAtmWorkflowSchema,
        inputStoresData,
        onWorkflowStarted,
        globalNotify,
      } = this.getProperties(
        'workflowManager',
        'space',
        'selectedAtmWorkflowSchema',
        'inputStoresData',
        'onWorkflowStarted',
        'globalNotify'
      );

      const atmWorkflowSchemaId = get(selectedAtmWorkflowSchema, 'entityId');
      const spaceId = get(space, 'entityId');
      try {
        const atmWorkflowExecution = await workflowManager.runWorkflow(
          atmWorkflowSchemaId,
          spaceId,
          inputStoresData
        );
        globalNotify.success(this.t('workflowStartSuccessNotify'));
        onWorkflowStarted && onWorkflowStarted(atmWorkflowExecution);
        safeExec(this, () => this.changeSlide('list'));
      } catch (e) {
        globalNotify.backendError(this.t('workflowStartFailureOperationName'));
      } finally {
        safeExec(this, () => this.set('isStartingWorkflow', false));
      }
    },
    backSlide() {
      this.changeSlide('list');
    },
  },
});
