/**
 * Renders full "run workflow" wizard
 *
 * @module components/space-automation/run-workflow-creator
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get, computed, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';

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
   * @virtual
   * @type {String}
   */
  workflowSchemaId: undefined,

  /**
   * @virtual optional
   * @type {Function}
   * @param {String} workflowSchemaId
   * @returns {any}
   */
  chooseWorkflowSchemaToRun: undefined,

  /**
   * @virtual optional
   * @type {Function}
   * @param {Models.AtmWorkflowExecution} atmWorkflowExecution
   * @returns {any}
   */
  onWorkflowStarted: undefined,

  /**
   * @type {String}
   */
  workflowSchemaIdToRun: undefined,

  /**
   * One of: `'list'`, `'inputStores'`
   * @type {String}
   */
  activeSlide: 'list',

  /**
   * @type {PromiseObject<Models.AtmWorkflowSchema>}
   */
  atmWorkflowSchemaToRunProxy: undefined,

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

  /**
   * @type {ComputedProperty<Boolean>}
   */
  areInitialValuesNeeded: computed(
    'atmWorkflowSchemaToRunProxy.content',
    function areInitialValuesNeeded() {
      const stores = this.get('atmWorkflowSchemaToRunProxy.content.stores') || [];
      return stores.isAny('requiresInitialValue');
    }
  ),

  atmWorkflowSchemaToRunLoader: observer(
    'workflowSchemaId',
    function atmWorkflowSchemaToRunLoader() {
      const {
        workflowSchemaId,
        workflowSchemaIdToRun,
        workflowManager,
        activeSlide,
      } = this.getProperties(
        'workflowSchemaId',
        'workflowSchemaIdToRun',
        'workflowManager',
        'activeSlide',
      );

      if (!workflowSchemaId) {
        if (activeSlide === 'inputStores') {
          this.changeSlide('list');
        }
        return;
      }

      this.changeSlide('inputStores');
      if (workflowSchemaId === workflowSchemaIdToRun) {
        return;
      }

      const loadSchemaPromise =
        workflowManager.getAtmWorkflowSchemaById(workflowSchemaId);

      this.setProperties({
        workflowSchemaIdToRun: workflowSchemaId,
        atmWorkflowSchemaToRunProxy: promiseObject(loadSchemaPromise),
        inputStoresData: undefined,
        areInputStoresValid: true,
      });
    }
  ),

  init() {
    this._super(...arguments);
    this.atmWorkflowSchemaToRunLoader();
  },

  changeSlide(newSlideId) {
    this.set('activeSlide', newSlideId);
  },

  actions: {
    atmWorkflowSchemaSelected(atmWorkflowSchema) {
      const chooseWorkflowSchemaToRun = this.get('chooseWorkflowSchemaToRun');
      chooseWorkflowSchemaToRun &&
        chooseWorkflowSchemaToRun(get(atmWorkflowSchema, 'entityId'));
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
        atmWorkflowSchemaToRunProxy,
        inputStoresData,
        onWorkflowStarted,
        globalNotify,
        chooseWorkflowSchemaToRun,
      } = this.getProperties(
        'workflowManager',
        'space',
        'atmWorkflowSchemaToRunProxy',
        'inputStoresData',
        'onWorkflowStarted',
        'globalNotify',
        'chooseWorkflowSchemaToRun'
      );

      const atmWorkflowSchemaId = get(atmWorkflowSchemaToRunProxy, 'entityId');
      const spaceId = get(space, 'entityId');
      try {
        const atmWorkflowExecution = await workflowManager.runWorkflow(
          atmWorkflowSchemaId,
          spaceId,
          inputStoresData || {}
        );
        globalNotify.success(this.t('workflowStartSuccessNotify'));
        onWorkflowStarted && onWorkflowStarted(atmWorkflowExecution);
        chooseWorkflowSchemaToRun && chooseWorkflowSchemaToRun(null);
      } catch (error) {
        globalNotify.backendError(this.t('workflowStartFailureOperationName'), error);
      } finally {
        safeExec(this, () => this.set('isStartingWorkflow', false));
      }
    },
    backSlide() {
      const chooseWorkflowSchemaToRun = this.get('chooseWorkflowSchemaToRun');
      chooseWorkflowSchemaToRun && chooseWorkflowSchemaToRun(null);
    },
  },
});
