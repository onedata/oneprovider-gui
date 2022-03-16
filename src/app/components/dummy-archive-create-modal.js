/**
 * Just for testing archive-create-modal
 *
 * @module components/dummy-archive-create-modal
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';

export default Component.extend({
  mockBackend: service(),

  open: true,

  space: reads('mockBackend.entityRecords.space.0'),

  dataset: reads('mockBackend.entityRecords.dataset.0'),

  actions: {
    hide() {
      this.set('open', false);
    },
    async createArchive(dataset, archiveData) {
      console.dir('archive data', archiveData);
      throw new Error('archiving failed');
    },
  },
});
