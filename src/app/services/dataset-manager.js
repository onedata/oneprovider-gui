/**
 * Provides model functions related to datasets.
 *
 * @module services/dataset-manager
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service from '@ember/service';
import { resolve } from 'rsvp';
import { get, set } from '@ember/object';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import sleep from 'onedata-gui-common/utils/sleep';

export default Service.extend({
  // TODO: VFS-7402 create dataset record using fileId in body,
  // then reload file and fileDatasetSummary records - this implementation is mock
  async establishDataset(file) {
    await sleep(100);
    const fileDatasetSummary = await get(file, 'fileDatasetSummary');
    const directDataset = set(fileDatasetSummary, 'directDataset', promiseObject(
      resolve(createDummyDataset())
    ));
    console.log('TODO: VFS-7402 dataset established for file', get(file, 'entityId'));
    return directDataset;
  },

  async destroyDataset(file) {
    await sleep(100);
    const fileDatasetSummary = await get(file, 'fileDatasetSummary');
    const directDataset = set(fileDatasetSummary, 'directDataset', promiseObject(
      resolve(null)
    ));
    console.log('TODO: VFS-7402 dataset destroyed for file', get(file, 'entityId'));
    return directDataset;
  },

  async toggleDatasetAttachment(dataset, state) {
    await sleep(100);
    set(dataset, 'attached', state);
    return dataset;
  },

  /**
   * @param {Models.Dataset} dataset
   * @param {Object} flagsData contains `{ flag_name: true/false }` to change
   * @returns {Promise<Models.Dataset>}
   */
  async toggleDatasetProtectionFlags(dataset, flagsData) {
    await sleep(100);
    if (flagsData['data_protection'] === undefined) {
      flagsData['data_protection'] =
        get(dataset, 'protectionFlags').includes('data_protection');
    }
    if (flagsData['metadata_protection'] === undefined) {
      flagsData['metadata_protection'] =
        get(dataset, 'protectionFlags').includes('metadata_protection');
    }
    const protectionFlags = [];
    for (const flag in flagsData) {
      if (flagsData[flag]) {
        protectionFlags.push(flag);
      }
    }
    set(dataset, 'protectionFlags', protectionFlags);
    return dataset;
  },
});

// TODO: VFS-7402 mock function to remove when model will be implemented
export function createDummyDataset(file, protectionFlags) {
  const entityId = btoa(Math.floor(Math.random() * 10000));
  const id = `op_dataset.${entityId}.instance:private`;
  return {
    id,
    entityId,
    rootFile: promiseObject(
      resolve(file || { entityId, name: 'Dummy Dir', type: 'dir', hasParent: false })
    ),
    protectionFlags: protectionFlags || ['data_protection', 'metadata_protection'],
  };
}
