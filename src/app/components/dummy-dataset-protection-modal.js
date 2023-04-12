/**
 * A dummy component for visually testing `dataset-protection-modal`
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads, equal } from '@ember/object/computed';
import { computed, get } from '@ember/object';
import { promise } from 'ember-awesome-macros';

export default Component.extend({
  opened: true,

  mockBackend: service(),
  datasetManager: service(),

  file: reads('mockBackend.entityRecords.chainDir.2'),

  // change for test to true if want to disable dataset edit features
  editPrivilege: true,

  datasetAttached: equal('file.fileDatasetSummary.directDataset.state', 'attached'),

  browsableDatasetProxy: promise.object(computed(
    'file.fileDatasetSummary.directDataset',
    async function browsableDatasetProxy() {
      const {
        file,
        datasetManager,
      } = this.getProperties('file', 'datasetManager');
      const summary = await get(file, 'fileDatasetSummary');
      return datasetManager.getBrowsableDataset(
        summary.relationEntityId('directDataset')
      );
    }
  )),

  onHide() {
    this.set('opened', false);
  },

  getDataUrl(data) {
    console.log('getDataUrl invoked', data);
    return `http://example.com/${data.fileId}?selected=${data.selected.join(',')}`;
  },

  getDatasetsUrl(data) {
    console.log('getDatasetsUrl invoked', data);
    return `http://example.com/datasets?selected=${data.datasetId}&viewMode=${data.viewMode}`;
  },
});
