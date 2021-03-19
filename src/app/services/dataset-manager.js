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
          rootFileId: get(file, 'entityId'),
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
    const fileRelation = dataset.belongsTo('rootFile');
    await dataset.destroy();
    if (fileRelation && fileRelation.id()) {
      const file = await fileRelation.reload();
      if (file) {
        await file.belongsTo('fileDatasetSummary').reload();
      }
    }
  },

  /**
   * @param {Models.Dataset} dataset
   * @param {Boolean} state whether dataset should be active for its rootFile
   * @returns {Promise<Models.Dataset>}
   */
  async toggleDatasetAttachment(dataset, state) {
    set(dataset, 'state', state ? 'attached' : 'detached');
    return await dataset.save();
  },

  /**
   * Toggle single flag - if you want to change multiple flags at once use
   * `changeMultipleDatasetProtectionFlags`.
   * @param {Models.Dataset} dataset
   * @param {String} flag name, eg. `metadata_protection`
   * @param {Boolean} state true if flag should be set, false if should be unset
   * @returns {Promise<Models.Dataset>}
   */
  async toggleDatasetProtectionFlag(dataset, flag, state) {
    const setProtectionFlags = [];
    const unsetProtectionFlags = [];
    if (state) {
      setProtectionFlags.push(flag);
    } else {
      unsetProtectionFlags.push(flag);
    }
    return await this.changeMultipleDatasetProtectionFlags(
      dataset,
      setProtectionFlags,
      unsetProtectionFlags
    );
  },

  /**
   * @param {Models.Dataset} dataset
   * @param {Array<String>} setProtectionFlags
   * @param {Array<String>} unsetProtectionFlags
   * @returns {Promise<Models.Dataset>}
   */
  async changeMultipleDatasetProtectionFlags(
    dataset,
    setProtectionFlags = [],
    unsetProtectionFlags = []
  ) {
    const onedataGraph = this.get('onedataGraph');
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
