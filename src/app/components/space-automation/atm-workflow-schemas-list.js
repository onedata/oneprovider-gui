/**
 * Shows a list of all available workflow schemas (from all user inventories).
 *
 * @module components/space-automation/atm-workflow-schemas-list
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { promise } from 'ember-awesome-macros';
import { computed } from '@ember/object';
import { sort } from '@ember/object/computed';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  classNames: ['atm-workflow-schemas-list'],

  i18n: service(),
  workflowManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceAutomation.atmWorkflowSchemasList',

  /**
   * @virtual
   * @type {Models.User}
   */
  user: undefined,

  /**
   * @type {Function}
   * @param {Models.AtmWorkflowSchema} selectedAtmWorkflowSchema
   * @returns {any}
   */
  onAtmWorkflowSchemaSelect: notImplementedIgnore,

  /**
   * @type {Array<String>}
   */
  atmWorkflowSchemasSorting: Object.freeze(['name']),

  /**
   * @type {ComputedProperty<PromiseArray<Models.AtmWorkflowSchema>>}
   */
  atmWorkflowSchemasProxy: promise.array(computed(function atmWorkflowSchemasProxy() {
    return this.get('workflowManager').getAllKnownAtmWorkflowSchemas();
  })),

  /**
   * @type {ComputedProperty<Array<Model.AtmWorkflowSchema>>}
   */
  sortedAtmWorkflowSchemas: sort(
    'atmWorkflowSchemasProxy.content',
    'atmWorkflowSchemasSorting'
  ),

  /**
   * This computed has no dependecies, because we need to wait only for the first fetch.
   * User will never change, additional inventories and workflows will be added on-the-fly.
   * @type {ComputedProperty<PromiseObject>}
   */
  dataLoadingProxy: computed(function dataLoadingProxy() {
    return this.get('atmWorkflowSchemasProxy');
  }),

  actions: {
    atmWorkflowSchemaSelected(atmWorkflowSchema) {
      const onAtmWorkflowSchemaSelect = this.get('onAtmWorkflowSchemaSelect');
      onAtmWorkflowSchemaSelect && onAtmWorkflowSchemaSelect(atmWorkflowSchema);
    },
  },
});
