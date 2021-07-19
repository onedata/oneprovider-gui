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
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';

export default Component.extend(I18n, {
  classNames: ['run-workflow-creator'],

  i18n: service(),
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
   * Id of workflow schema, which should be used to create new execution.
   * If empty - list of workflow schemas is rendered, if present -
   * form for specific schema is visible.
   * @virtual
   * @type {String}
   */
  atmWorkflowSchemaId: undefined,

  /**
   * If true, then values saved in localStorage will be used to prefill input
   * stores data.
   * @virtual
   * @type {Boolean}
   */
  fillInputStores: false,

  /**
   * @virtual optional
   * @type {Function}
   * @param {String} atmWorkflowSchemaId
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
   * Latest non-empty value of `atmWorkflowSchemaId`. This field is needed to remember
   * workflow schema id after its change to empty value, so the view of stores form
   * for workflow schema can be still rendered during the transition of carousel.
   * @type {String}
   */
  atmWorkflowSchemaIdToRun: undefined,

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
    'atmWorkflowSchemaId',
    function atmWorkflowSchemaToRunLoader() {
      const {
        atmWorkflowSchemaId,
        atmWorkflowSchemaIdToRun,
        workflowManager,
        activeSlide,
      } = this.getProperties(
        'atmWorkflowSchemaId',
        'atmWorkflowSchemaIdToRun',
        'workflowManager',
        'activeSlide',
      );

      if (!atmWorkflowSchemaId) {
        if (activeSlide === 'inputStores') {
          this.changeSlide('list');
        }
        return;
      }

      this.changeSlide('inputStores');
      if (atmWorkflowSchemaId === atmWorkflowSchemaIdToRun) {
        return;
      }

      const loadSchemaPromise =
        workflowManager.getAtmWorkflowSchemaById(atmWorkflowSchemaId);

      this.setProperties({
        atmWorkflowSchemaIdToRun: atmWorkflowSchemaId,
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
      if (chooseWorkflowSchemaToRun) {
        chooseWorkflowSchemaToRun(get(atmWorkflowSchema, 'entityId'));
      }
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
        atmWorkflowSchemaIdToRun,
        inputStoresData,
        onWorkflowStarted,
        globalNotify,
        chooseWorkflowSchemaToRun,
      } = this.getProperties(
        'workflowManager',
        'space',
        'atmWorkflowSchemaIdToRun',
        'inputStoresData',
        'onWorkflowStarted',
        'globalNotify',
        'chooseWorkflowSchemaToRun'
      );

      const spaceId = get(space, 'entityId');
      try {
        const atmWorkflowExecution = await workflowManager.runWorkflow(
          atmWorkflowSchemaIdToRun,
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
