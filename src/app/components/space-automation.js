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
import { get, observer } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';
import { conditional, raw, array } from 'ember-awesome-macros';
import { reject, hash as hashFulfilled } from 'rsvp';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';

const possibleTabs = [
  'waiting',
  'ongoing',
  'ended',
  'preview',
  'create',
];

export default Component.extend(I18n, {
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
   * One of: `'waiting'`, `'ongoing'`, `'ended'`, `'create'`, `'preview'`
   * @type {ComputedProperty<String>}
   */
  normalizedTab: conditional(
    array.includes(raw(possibleTabs), 'tab'),
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

      if (!atmWorkflowExecutionId && normalizedTab === 'preview') {
        this.get('closePreviewTab')();
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

    this.set('possibleTabs', [...possibleTabs]);
    this.atmWorkflowExecutionForPreviewLoader();
  },

  actions: {
    changeTab(tab) {
      this.get('changeTab')(tab);
    },
    workflowStarted() {
      this.get('changeTab')('waiting');
    },
    workflowSelected(atmWorkflowExecutionSummary) {
      this.get('openPreviewTab')(get(atmWorkflowExecutionSummary, 'entityId'));
    },
    closeWorkflowPreview() {
      this.get('closePreviewTab')();
    },
    chooseWorkflowSchemaToRun(atmWorkflowSchemaId) {
      this.get('chooseWorkflowSchemaToRun')(atmWorkflowSchemaId);
    },
  },
});
