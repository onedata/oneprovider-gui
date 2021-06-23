/**
 * Visually test space-automation component with mocked backend
 *
 * @module components/dummy-space-automation
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get, computed } from '@ember/object';
import { promise } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';

export default Component.extend({
  currentUser: service(),

  tab: undefined,

  workflowExecutionId: undefined,

  spaceProxy: promise.object(computed(function spaceProxy() {
    return this.get('currentUser').getCurrentUserRecord()
      .then(user => get(user, 'effSpaceList'))
      .then(effSpaceList => get(effSpaceList, 'list'))
      .then(list => list.objectAt(0));
  })),

  actions: {
    changeTab(tab) {
      this.set('tab', tab);
    },
    openPreviewTab(workflowExecutionId) {
      this.setProperties({
        tab: 'preview',
        workflowExecutionId,
      });
    },
    closePreviewTab() {
      const tab = this.get('tab');
      this.setProperties({
        tab: tab === 'preview' ? 'waiting' : (tab || null),
        workflowExecutionId: null,
      });
    },
  },
});
