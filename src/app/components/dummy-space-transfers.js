/**
 * Visually test space-transfers component with mocked backend
 *
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get, computed } from '@ember/object';
import { promise } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';

export default Component.extend({
  currentUser: service(),
  mockBackend: service(),

  firstFile: computed(function firstFile() {
    return this.get('mockBackend.entityRecords.rootDir.firstObject');
  }),

  fileId: reads('firstFile.entityId'),

  spaceProxy: promise.object(computed(function spaceProxy() {
    return this.get('currentUser').getCurrentUserRecord()
      .then(user => get(user, 'effSpaceList'))
      .then(effSpaceList => get(effSpaceList, 'list'))
      .then(list => list.objectAt(0));
  })),

  actions: {
    resetQueryParams() {},
    changeListTab() {},
    closeFileTab() {},
  },
});
