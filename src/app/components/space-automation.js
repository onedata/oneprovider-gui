/**
 * A view component for space automation aspect
 *
 * @module components/space-automation
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { get, getProperties, observer, computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';
import { conditional, array } from 'ember-awesome-macros';
import { reject, hash as hashFulfilled } from 'rsvp';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import Looper from 'onedata-gui-common/utils/looper';
import {
  AtmWorkflowExecutionPhase,
  atmWorkflowExecutionPhases,
  translateAtmWorkflowExecutionPhase,
} from 'onedata-gui-common/utils/workflow-visualiser/statuses';

const mixins = [
  I18n,
  createDataProxyMixin('suspendedExecutionsCountInfo'),
];

const suspendedExecutionsCounterLimit = 50;

/**
 * @typedef {'cancel'|'pause'|'resume'|'remove'} AtmWorkflowExecutionLifecycleChangingOperation
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
  possibleTabs: undefined,

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
   * @type {ComputedProperty<string|undefined>}
   */
  atmWorkflowExecutionForPreviewLabel: computed(
    'atmWorkflowExecutionForPreviewProxy.atmWorkflowSchemaSnapshot.{name,revisionRegistry}',
    function atmWorkflowExecutionForPreviewLabel() {
      const atmWorkflowSchemaSnapshot =
        this.get('atmWorkflowExecutionForPreviewProxy.atmWorkflowSchemaSnapshot');
      if (atmWorkflowSchemaSnapshot) {
        const {
          name,
          revisionRegistry,
        } = getProperties(atmWorkflowSchemaSnapshot, 'name', 'revisionRegistry');
        if (name && revisionRegistry) {
          return this.t('tabs.preview.tabLoadedLabel', {
            schemaName: name,
            revisionNumber: Object.keys(revisionRegistry)[0] || 1,
          });
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
    this.setProperties({
      possibleTabs: [
        ...atmWorkflowExecutionPhases,
        'preview',
        'create',
      ],
      suspendedExecutionsCountInfoUpdater,
    });

    this.atmWorkflowExecutionForPreviewLoader();
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
