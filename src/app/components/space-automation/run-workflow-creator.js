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
   * @param {number} atmWorkflowSchemaRevisionNumber
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
   * See `atmWorkflowSchemaIdToRun`
   * @type {String}
   */
  atmWorkflowSchemaRevisionNumberToRun: undefined,

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
   * @type {ComputedProperty<AtmWorkflowSchemaRevision>}
   */
  atmWorkflowSchemaRevision: computed(
    'atmWorkflowSchemaToRunProxy.content.revisionRegistry',
    'atmWorkflowSchemaRevisionNumber',
    function atmWorkflowSchemaRevision() {
      return this.get(
        `atmWorkflowSchemaToRunProxy.content.revisionRegistry.${this.get('atmWorkflowSchemaRevisionNumber')}`
      );
    }
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  areInitialValuesNeeded: computed(
    'atmWorkflowSchemaRevision.stores',
    function areInitialValuesNeeded() {
      const stores = this.get('atmWorkflowSchemaRevision.stores');
      if (!stores) {
        return;
      }
      return stores.isAny('requiresInitialValue');
    }
  ),

  atmWorkflowSchemaToRunLoader: observer(
    'atmWorkflowSchemaId',
    'atmWorkflowSchemaRevisionNumber',
    function atmWorkflowSchemaToRunLoader() {
      const {
        atmWorkflowSchemaId,
        atmWorkflowSchemaRevisionNumber,
        atmWorkflowSchemaIdToRun,
        atmWorkflowSchemaRevisionNumberToRun,
        workflowManager,
        activeSlide,
      } = this.getProperties(
        'atmWorkflowSchemaId',
        'atmWorkflowSchemaRevisionNumber',
        'atmWorkflowSchemaIdToRun',
        'atmWorkflowSchemaRevisionNumberToRun',
        'workflowManager',
        'activeSlide',
      );

      if (!atmWorkflowSchemaId || !atmWorkflowSchemaRevisionNumber) {
        if (activeSlide === 'inputStores') {
          this.changeSlide('list');
        }
        return;
      }

      this.changeSlide('inputStores');
      if (
        atmWorkflowSchemaId === atmWorkflowSchemaIdToRun &&
        atmWorkflowSchemaRevisionNumber === atmWorkflowSchemaRevisionNumberToRun
      ) {
        return;
      }

      const loadSchemaPromise =
        workflowManager.getAtmWorkflowSchemaById(atmWorkflowSchemaId);

      this.setProperties({
        atmWorkflowSchemaIdToRun: atmWorkflowSchemaId,
        atmWorkflowSchemaRevisionNumberToRun: atmWorkflowSchemaRevisionNumber,
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
    atmWorkflowSchemaRevisionSelected(
      atmWorkflowSchema,
      atmWorkflowSchemaRevisionNumber
    ) {
      const chooseWorkflowSchemaToRun = this.get('chooseWorkflowSchemaToRun');
      if (chooseWorkflowSchemaToRun) {
        chooseWorkflowSchemaToRun(
          get(atmWorkflowSchema, 'entityId'),
          atmWorkflowSchemaRevisionNumber
        );
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
        atmWorkflowSchemaRevisionNumberToRun,
        inputStoresData,
        onWorkflowStarted,
        globalNotify,
        chooseWorkflowSchemaToRun,
      } = this.getProperties(
        'workflowManager',
        'space',
        'atmWorkflowSchemaIdToRun',
        'atmWorkflowSchemaRevisionNumberToRun',
        'inputStoresData',
        'onWorkflowStarted',
        'globalNotify',
        'chooseWorkflowSchemaToRun'
      );

      const spaceId = get(space, 'entityId');
      try {
        const atmWorkflowExecution = await workflowManager.runWorkflow(
          atmWorkflowSchemaIdToRun,
          atmWorkflowSchemaRevisionNumberToRun,
          spaceId,
          inputStoresData || {}
        );
        globalNotify.success(this.t('workflowStartSuccessNotify'));
        onWorkflowStarted && onWorkflowStarted(atmWorkflowExecution);
        chooseWorkflowSchemaToRun && chooseWorkflowSchemaToRun(null, null);
      } catch (error) {
        globalNotify.backendError(this.t('workflowStartFailureOperationName'), error);
      } finally {
        safeExec(this, () => this.set('isStartingWorkflow', false));
      }
    },
    backSlide() {
      const chooseWorkflowSchemaToRun = this.get('chooseWorkflowSchemaToRun');
      chooseWorkflowSchemaToRun && chooseWorkflowSchemaToRun(null, null);
    },
  },
});
