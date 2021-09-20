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
import { reads, equal } from '@ember/object/computed';
import { get, set } from '@ember/object';

export default Component.extend({
  opened: true,

  mockBackend: service(),

  // FIXME: refactor component for only one file
  files: collect(
    // use/uncomment for dataset with ancestors
    // 'mockBackend.entityRecords.chainDir.2',
    // use/uncomment for dataset with archives
    'mockBackend.entityRecords.dir.0',
  ),

  file: reads('files.firstObject'),

  space: reads('mockBackend.entityRecords.space.firstObject'),

  // change for test to true if want to disable dataset edit features
  editPrivilege: true,

  datasetAttached: equal('file.fileDatasetSummary.directDataset.state', 'attached'),

  onHide() {
    this.set('opened', false);
  },

  getDataUrl(data) {
    return `http://example.com/${data.fileId}?selected=${data.selected.join(',')}`;
  },

  actions: {
    async toggleDatasetAttached(state) {
      const summary = await this.get('file.fileDatasetSummary');
      const dataset = await get(summary, 'directDataset');
      set(dataset, 'state', state ? 'attached' : 'detached');
      return await dataset.save();
    },
  },
});
