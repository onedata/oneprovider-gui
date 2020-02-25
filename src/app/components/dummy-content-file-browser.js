/**
 * Standalone component to test file browser without injected properties.
 * 
 * @module components/dummy-content-file-browser
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { get, computed } from '@ember/object';
import { promise } from 'ember-awesome-macros';

export default Component.extend({
  currentUser: service(),
  onedataGraph: service(),
  fileManager: service(),

  classNames: ['dummy-content-file-browser'],

  selectedFiles: Object.freeze([]),

  dirProxy: promise.object(computed(function dirProxy() {
    return this.get('currentUser').getCurrentUserRecord()
      .then(user => get(user, 'spaceList'))
      .then(spaceList => get(spaceList, 'list'))
      .then(list => list.objectAt(0))
      .then(space => get(space, 'rootDir'));
  })),

  actions: {
    immediatelyRemove(files, parentDir) {
      const {
        onedataGraph,
        fileManager,
      } = this.getProperties('onedataGraph', 'fileManager');
      const parentEntityId = get(parentDir, 'entityId');
      files.forEach(f => {
        onedataGraph.removeMockChild(
          parentEntityId,
          get(f, 'entityId')
        );
      });
      fileManager.dirChildrenRefresh(parentEntityId);
    },
  },
});
