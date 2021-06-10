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

export default Component.extend(I18n, {
  classNames: ['run-workflow-creator'],

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
   * @type {ComputedProperty<PromiseObject>}
   */
  userProxy: reads('currentUser.userProxy'),

  /**
   * @type {ComputedProperty<Models.User>}
   */
  user: reads('userProxy.content'),

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
      await workflowManager.runWorkflow(
        atmWorkflowSchemaId,
        spaceId,
        inputStoresData
      );
      globalNotify.success(this.t('workflowStartSuccessNotify'));
      onWorkflowStarted && onWorkflowStarted();
    },
    backSlide() {
      this.set('activeSlide', 'list');
    },
  },
});
