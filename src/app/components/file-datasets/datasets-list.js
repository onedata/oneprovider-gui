/**
 * Provides list of datasets with their root file paths sorted by path length.
 * The nearest parent to file displayed in modal should be on top of the list.
 *
 * @module components/file-datasets/datasets-list
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import resolveFilePath from 'oneprovider-gui/utils/resolve-file-path';
import { get, computed } from '@ember/object';
import { sort, reads } from '@ember/object/computed';
import { promise } from 'ember-awesome-macros';
import { all as allFulfilled } from 'rsvp';

export default Component.extend({
  /**
   * @virtual
   * @type {Array<Models.Dataset>}
   */
  datasets: undefined,

  /**
   * @type {ComputedProperty<PromiseArray<{ dataset: Models.Dataset, filePath: Array<Models.File> }>>}
   */
  dataListProxy: promise.array(computed('datasets', async function dataListProxy() {
    const datasets = this.get('datasets');
    const files = await allFulfilled(datasets.map(dataset => get(dataset, 'rootFile')));
    const paths = await allFulfilled(files.map(file => resolveFilePath(file)));
    const list = [];
    for (let i = 0; i < get(datasets, 'length'); ++i) {
      list[i] = {
        dataset: datasets[i],
        filePath: paths[i],
      };
    }
    return list;
  })),

  /**
   * @type {ComputedProperty<Array<{ dataset: Models.Dataset, filePath: Array<Models.File> }>>}
   */
  dataList: reads('dataListProxy.content.[]'),

  /**
   * Sorting of result list specification
   * @type {Array<String>}
   */
  sorting: Object.freeze(['filePath.length:desc']),

  /**
   * Main reason for this component to exist - exposes a sorted collection of pairs:
   * `(dataset, path to root file)` in array of objects format (see type specification).
   * @type {ComputedProperty<Array<{ dataset: Models.Dataset, filePath: Array<Models.File> }>>}
   */
  sortedDataList: sort('dataList', 'sorting'),
});
