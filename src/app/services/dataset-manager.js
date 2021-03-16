/**
 * Provides model functions related to datasets.
 *
 * @module services/dataset-manager
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

// TODO: VFS-7414 API is not tested and stable yet

import Service from '@ember/service';
import { allSettled } from 'rsvp';
import { get, set } from '@ember/object';
import { inject as service } from '@ember/service';

export default Service.extend({
  onedataGraph: service(),
  store: service(),

  /**
   * @param {Models.File} file
   * @returns {Promise<Models.Dataset>}
   */
  async establishDataset(file) {
    const store = this.get('store');
    const dataset = store.createRecord('dataset', {
      _meta: {
        additionalData: {
          fileId: get(file, 'entityId'),
          // also protectionFlags can be specified here, but we don't use this
        },
      },
    });
    await dataset.save();
    // TODO: VFS-7414 check if parallel reloading record and relation will not crash
    await allSettled([
      file.reload(),
      file.belongsTo('fileDatasetSummary').reload(),
    ]);
    return dataset;
  },

  /**
   * @param {Models.Dataset} dataset
   */
  async destroyDataset(dataset) {
    const file = await get(dataset, 'rootFile');
    await dataset.destroy();
    if (file) {
      await allSettled([
        file.reload(),
        file.belongsTo('fileDatasetSummary').reload(),
      ]);
    }
  },

  /**
   * @param {Models.Dataset} dataset
   * @param {Boolean} state whether dataset should be active for its rootFile
   * @returns {Promise<Models.Dataset>}
   */
  async toggleDatasetAttachment(dataset, state) {
    set(dataset, 'attached', state);
    return await dataset.save();
  },

  /**
   * @param {Models.Dataset} dataset
   * @param {Object} flagsData contains `{ flag_name: true/false }` to change
   * @returns {Promise<Models.Dataset>}
   */
  async toggleDatasetProtectionFlags(dataset, flagsData) {
    const onedataGraph = this.get('onedataGraph');
    const setProtectionFlags = [];
    const unsetProtectionFlags = [];
    for (const flag in flagsData) {
      if (flagsData[flag]) {
        setProtectionFlags.push[flag];
      } else {
        unsetProtectionFlags.push[flag];
      }
    }
    const gri = get(dataset, 'gri');
    await onedataGraph.request({
      gri,
      operation: 'update',
      data: {
        setProtectionFlags,
        unsetProtectionFlags,
      },
    });
    await dataset.reload();
    const file = await get(dataset, 'rootFile');
    // TODO: VFS-7414 check if parallel reloading record and relation will not crash
    await allSettled([
      file.reload(),
      file.belongsTo('fileDatasetSummary').reload(),
    ]);
    return dataset;
  },
});
