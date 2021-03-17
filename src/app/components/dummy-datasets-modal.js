/**
 * A dummy component for visually testing `datasets-modal`
 *
 * @module components/dummy-datasets-modal
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { collect } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { set } from '@ember/object';

export default Component.extend({
  opened: true,

  mockBackend: service(),

  files: collect(
    'mockBackend.entityRecords.chainDir.3',
  ),

  file: reads('files.firstObject'),

  // change for test to true if want to disable dataset edit features
  editPrivilege: true,

  datasetAttached: reads('file.fileDatasetSummary.directDataset.attached'),

  onHide() {
    this.set('opened', false);
  },

  getDataUrl(data) {
    console.log('getDataUrl invoked', data);
    return `http://example.com/${data.fileId}?selected=${data.selected.join(',')}`;
  },

  actions: {
    async toggleDatasetAttached(state) {
      const dataset = await this.get('file.fileDatasetSummary.directDataset');
      set(dataset, 'attached', state);
      return await dataset.save();
    },
  },
});
