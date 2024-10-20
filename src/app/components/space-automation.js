/**
 * A view component for space automation aspect
 *
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { get, getProperties, observer, computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/i18n';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';
import { promise, conditional, array } from 'ember-awesome-macros';
import { reject, hash as hashFulfilled } from 'rsvp';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import Looper from 'onedata-gui-common/utils/looper';
import {
  AtmWorkflowExecutionPhase,
  atmWorkflowExecutionPhases,
  translateAtmWorkflowExecutionPhase,
} from 'onedata-gui-common/utils/workflow-visualiser/statuses';

const basicTabs = atmWorkflowExecutionPhases;
const prioritisedBasicTabs = Object.freeze([
  AtmWorkflowExecutionPhase.Ongoing,
  AtmWorkflowExecutionPhase.Waiting,
  AtmWorkflowExecutionPhase.Ended,
]);
const allTabs = Object.freeze([
  ...basicTabs,
  'preview',
  'create',
]);
const defaultTab = prioritisedBasicTabs[0];

const mixins = [
  I18n,
  createDataProxyMixin('suspendedExecutionsCountInfo'),
];

const suspendedExecutionsCounterLimit = 50;

/**
 * @typedef {'cancel'|'forceContinue'|'pause'|'resume'|'remove'} AtmWorkflowExecutionLifecycleChangingOperation
 */

export default Component.extend(...mixins, {
  classNames: ['space-automation', 'fill-flex-using-column'],

  i18n: service(),
  workflowManager: service(),
  currentUser: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceAutomation',

  /**
   * @virtual
   * @type {Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  changeTab: notImplementedWarn,

  /**
   * @virtual
   * @type {Function}
   */
  openPreviewTab: notImplementedWarn,

  /**
   * @virtual
   * @type {Function}
   */
  closePreviewTab: notImplementedWarn,

  /**
   * @virtual
   * @type {Function}
   */
  chooseWorkflowSchemaToRun: notImplementedWarn,

  /**
   * @virtual
   * @type {String}
   */
  tab: undefined,

  /**
   * Id of a workflow execution, that should be rendered in a dedicated "preview" tab.
   * @virtual
   * @type {String}
   */
  atmWorkflowExecutionId: undefined,

  /**
   * @virtual
   * @type {String}
   */
  atmWorkflowSchemaId: undefined,

  /**
   * @virtual
   * @type {RevisionNumber|null}
   */
  atmWorkflowSchemaRevisionNumber: undefined,

  /**
   * @virtual
   * @type {Boolean}
   */
  fillInputStores: false,

  /**
   * @type {String}
   */
  atmWorkflowExecutionIdInPreview: undefined,

  /**
   * @type {Array<String>}
   */
  possibleTabs: allTabs,

  /**
   * @type {Object<string, AtmWorkflowExecutionPhase>}
   */
  AtmWorkflowExecutionPhase,

  /**
   * @type {Array<AtmWorkflowExecutionPhase>}
   */
  atmWorkflowExecutionPhases,

  /**
   * @type {Looper}
   */
  suspendedExecutionsCountInfoUpdater: undefined,

  /**
   * @type {ComputedProperty<String>}
   */
  normalizedTab: conditional(
    array.includes('possibleTabs', 'tab'),
    'tab',
    'possibleTabs.firstObject'
  ),

  /**
   * @type {ComputedProperty<Array<string>>}
   */
  visibleTabs: computed('normalizedTab', 'possibleTabs', function visibleTabs() {
    // When user switches to workflow creation tab, we hide it from the screen
    return this.normalizedTab === 'create' ?
      this.possibleTabs.filter((tab) => tab !== 'create') : this.possibleTabs;
  }),

  /**
   * @type {Object}
   */
  tabIcons: Object.freeze({
    create: 'play',
    preview: 'atm-workflow',
  }),

  /**
   * @type {PromiseObject<Models.AtmWorkflowExecution>}
   */
  atmWorkflowExecutionForPreviewProxy: undefined,

  /**
   * @type {ComputedProperty<{ name: string, conflictLabel: string, revisionNumber: number } | undefined>}
   */
  atmWorkflowExecutionForPreviewLabelData: computed(
    'atmWorkflowExecutionForPreviewProxy.atmWorkflowSchemaSnapshot.{name,revisionRegistry}',
    function atmWorkflowExecutionForPreviewLabelData() {
      const atmWorkflowSchemaSnapshot =
        this.get('atmWorkflowExecutionForPreviewProxy.atmWorkflowSchemaSnapshot');
      if (atmWorkflowSchemaSnapshot) {
        const {
          name,
          revisionRegistry,
        } = getProperties(atmWorkflowSchemaSnapshot, 'name', 'revisionRegistry');
        const entityId = get(this.atmWorkflowExecutionForPreviewProxy, 'entityId');
        if (name && revisionRegistry) {
          return {
            name,
            conflictLabel: entityId?.slice(0, 4) ?? '',
            revisionNumber: Object.keys(revisionRegistry)[0] || 1,
          };
        }
      }
    }
  ),

  /**
   * @type {ComputedProperty<(tabId: string) => SafeString>}
   */
  getTabLabel: computed(function getTabLabel() {
    return (tabId) => {
      return atmWorkflowExecutionPhases.includes(tabId) ?
        translateAtmWorkflowExecutionPhase(this.i18n, tabId) :
        this.t(`tabs.${tabId}.tabLabel`);
    };
  }),

  /**
   * @type {ComputedProperty<PromiseObject<string>>}
   */
  initialTabProxy: promise.object(computed(async function initialTabProxy() {
    if (this.possibleTabs.includes(this.tab)) {
      return this.tab;
    } else {
      return await this.findNonEmptyCollection();
    }
  })),

  atmWorkflowExecutionForPreviewLoader: observer(
    'atmWorkflowExecutionId',
    'space',
    function atmWorkflowExecutionForPreviewLoader() {
      const {
        atmWorkflowExecutionId,
        atmWorkflowExecutionIdInPreview,
        workflowManager,
        normalizedTab,
        space,
      } = this.getProperties(
        'atmWorkflowExecutionId',
        'atmWorkflowExecutionIdInPreview',
        'workflowManager',
        'normalizedTab',
        'space'
      );

      if (!atmWorkflowExecutionId) {
        if (normalizedTab === 'preview') {
          this.get('closePreviewTab')();
        }
        this.setProperties({
          atmWorkflowExecutionIdInPreview: atmWorkflowExecutionId,
          atmWorkflowExecutionForPreviewProxy: undefined,
        });
        return;
      }
      if (atmWorkflowExecutionId === atmWorkflowExecutionIdInPreview) {
        return;
      }

      const loadExecutionPromise =
        workflowManager.getAtmWorkflowExecutionById(atmWorkflowExecutionId)
        .then(atmWorkflowExecution => hashFulfilled({
          atmWorkflowSchemaSnapshot: get(atmWorkflowExecution, 'atmWorkflowSchemaSnapshot'),
          space: get(atmWorkflowExecution, 'space'),
        }).then(({ space: executionSpace }) => {
          if (executionSpace !== space) {
            // Workflow execution is not in current space.
            return reject({ id: 'notFound' });
          }
          return atmWorkflowExecution;
        }));

      this.setProperties({
        atmWorkflowExecutionIdInPreview: atmWorkflowExecutionId,
        atmWorkflowExecutionForPreviewProxy: promiseObject(loadExecutionPromise),
      });
    }
  ),

  init() {
    this._super(...arguments);

    const suspendedExecutionsCountInfoUpdater = Looper.create({
      immediate: false,
      interval: 5000,
    });
    suspendedExecutionsCountInfoUpdater.on('tick', () => {
      this.updateSuspendedExecutionsCountInfoProxy({ replace: true });
    });
    this.set('suspendedExecutionsCountInfoUpdater', suspendedExecutionsCountInfoUpdater);

    (async () => {
      const initialTab = await this.initialTabProxy;
      if (this.tab !== initialTab) {
        this.changeTab(initialTab);
      }
      this.atmWorkflowExecutionForPreviewLoader();
    })();
  },

  willDestroyElement() {
    try {
      this.suspendedExecutionsCountInfoUpdater?.destroy();
    } finally {
      this._super(...arguments);
    }
  },

  /**
   * @override
   * @returns {Promise<{ content: string|null, className: string }>}
   */
  async fetchSuspendedExecutionsCountInfo() {
    const { array: executions } = await this.workflowManager
      .getAtmWorkflowExecutionSummariesForSpace(
        this.space,
        AtmWorkflowExecutionPhase.Suspended,
        null,
        suspendedExecutionsCounterLimit + 1
      );
    const executionsCount = executions?.length || 0;
    if (executionsCount > suspendedExecutionsCounterLimit) {
      return {
        content: `${suspendedExecutionsCounterLimit}+`,
        className: 'text-danger',
      };
    } else {
      return {
        content: executionsCount > 0 ? String(executionsCount) : null,
        className: executionsCount > 0 ? 'text-danger' : '',
      };
    }
  },

  /**
   * @returns {Promise<AtmWorkflowExecutionPhase>}
   */
  async findNonEmptyCollection() {
    try {
      for (const collectionName of prioritisedBasicTabs) {
        const collectionWorkflows = await this.workflowManager
          .getAtmWorkflowExecutionSummariesForSpace(
            this.space,
            collectionName,
            null,
            1,
            0,
          );
        if (collectionWorkflows.array.length) {
          return collectionName;
        }
      }
      return defaultTab;
    } catch (error) {
      console.error('Cannot fetch workflow executions due to error:', error);
      return defaultTab;
    }
  },

  actions: {
    changeTab(tab) {
      this.get('changeTab')(tab);
    },
    workflowStarted(atmWorkflowExecution) {
      this.get('openPreviewTab')(get(atmWorkflowExecution, 'entityId'));
    },
    workflowSelected(atmWorkflowExecutionSummary) {
      this.get('openPreviewTab')(get(atmWorkflowExecutionSummary, 'entityId'));
    },

    /**
     * @param {Models.AtmWorkflowExecutionSummary} atmWorkflowExecutionSummary
     * @param {AtmWorkflowExecutionLifecycleChangingOperation} lifecycleChangingOperation
     * @returns {void}
     */
    workflowLifecycleChanged(atmWorkflowExecutionSummary, lifecycleChangingOperation) {
      if (
        lifecycleChangingOperation === 'pause' ||
        lifecycleChangingOperation === 'resume'
      ) {
        this.updateSuspendedExecutionsCountInfoProxy({ replace: true });
      }
      if (
        lifecycleChangingOperation === 'remove' &&
        get(atmWorkflowExecutionSummary, 'entityId') === this.atmWorkflowExecutionIdInPreview
      ) {
        this.closePreviewTab();
      }
    },

    closeWorkflowPreview() {
      this.get('closePreviewTab')();
    },
    chooseWorkflowSchemaToRun(atmWorkflowSchemaId, atmWorkflowSchemaRevisionNumber) {
      this.get('chooseWorkflowSchemaToRun')(
        atmWorkflowSchemaId,
        atmWorkflowSchemaRevisionNumber
      );
    },
  },
});
