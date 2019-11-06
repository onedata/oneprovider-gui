/**
 * Visually test space-transfers component with mocked backend
 * 
 * @module components/dummy-space-transfers
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get, computed } from '@ember/object';
import { promise } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';

export default Component.extend({
  currentUser: service(),

  fileId: undefined,

  defaultTab: 'current',

  spaceProxy: promise.object(computed(function dirProxy() {
    return this.get('currentUser').getCurrentUserRecord()
      .then(user => get(user, 'spaceList'))
      .then(spaceList => get(spaceList, 'list'))
      .then(list => list.objectAt(0));
  })),

  actions: {
    resetQueryParams() {},
    changeListTab() {},
    closeFileTab() {},
  },
});
