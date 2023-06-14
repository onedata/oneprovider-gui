/**
 * Renders full "run workflow" wizard
 *
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
import { EntrySeverity } from 'onedata-gui-common/utils/audit-log';

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
   * @param {RevisionNumber} atmWorkflowSchemaRevisionNumber
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
   * @type {RevisionNumber}
   */
  atmWorkflowSchemaRevisionNumberToRun: undefined,

  /**
   * One of: `'list'`, `'setup'`
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
   * Data from execution-options-form
   * @type {{ loggingLevel: AuditLogEntrySeverity}}
   */
  executionOptionsData: undefined,

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
  areInitialContentsNeeded: computed(
    'atmWorkflowSchemaRevision.stores',
    function areInitialContentsNeeded() {
      const stores = this.get('atmWorkflowSchemaRevision.stores');
      if (!stores) {
        return;
      }
      return stores.isAny('requiresInitialContent');
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
        if (activeSlide === 'setup') {
          this.changeSlide('list');
        }
        return;
      }

      this.changeSlide('setup');
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
      this.chooseWorkflowSchemaToRun?.(
        get(atmWorkflowSchema, 'entityId'),
        atmWorkflowSchemaRevisionNumber
      );
    },
    inputStoresChanged({ data, isValid }) {
      this.setProperties({
        inputStoresData: data,
        areInputStoresValid: isValid,
      });
    },
    executionOptionsChanged(data) {
      this.set('executionOptionsData', data);
      console.log(data);
    },
    async runWorkflow() {
      this.set('isStartingWorkflow', true);

      const spaceId = get(this.space, 'entityId');
      try {
        const atmWorkflowExecution = await this.workflowManager.runWorkflow(
          this.atmWorkflowSchemaIdToRun,
          this.atmWorkflowSchemaRevisionNumberToRun,
          spaceId,
          this.inputStoresData ?? {},
          this.executionOptionsData?.loggingLevel ?? EntrySeverity.Info
        );
        this.globalNotify.success(this.t('workflowStartSuccessNotify'));
        this.onWorkflowStarted?.(atmWorkflowExecution);
        this.chooseWorkflowSchemaToRun?.(null, null);
      } catch (error) {
        this.globalNotify.backendError(this.t('workflowStartFailureOperationName'), error);
      } finally {
        safeExec(this, () => this.set('isStartingWorkflow', false));
      }
    },
    backSlide() {
      this.chooseWorkflowSchemaToRun?.(null, null);
    },
  },
});
