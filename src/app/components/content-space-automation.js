/**
 * Container for space automation view to use in an iframe with injected properties.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OneEmbeddedComponent from 'oneprovider-gui/components/one-embedded-component';
import { inject as service } from '@ember/service';
import ContentSpaceBaseMixin from 'oneprovider-gui/mixins/content-space-base';

export default OneEmbeddedComponent.extend(ContentSpaceBaseMixin, {
  classNames: ['content-space-automation'],

  store: service(),

  /**
   * @override
   */
  iframeInjectedProperties: Object.freeze([
    'spaceEntityId',
    'tab',
    'workflowExecutionId',
    'workflowSchemaId',
    'workflowSchemaRevision',
    'fillInputStores',
  ]),

  /**
   * @override
   */
  iframeInjectedNavigationProperties: Object.freeze([
    'spaceEntityId',
    'tab',
    'workflowExecutionId',
    'workflowSchemaId',
    'workflowSchemaRevision',
  ]),

  actions: {
    changeTab(tab) {
      return this.callParent('changeTab', tab);
    },
    openPreviewTab(atmWorkflowExecutionId) {
      return this.callParent('openPreviewTab', atmWorkflowExecutionId);
    },
    closePreviewTab() {
      return this.callParent('closePreviewTab');
    },
    chooseWorkflowSchemaToRun(atmWorkflowSchemaId, atmWorkflowSchemaRevisionNumber) {
      return this.callParent(
        'chooseWorkflowSchemaToRun',
        atmWorkflowSchemaId,
        atmWorkflowSchemaRevisionNumber
      );
    },
  },
});
