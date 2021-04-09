/**
 * Provides data for rendering list of dataset-items with ancestor datasets.
 *
 * @module components/file-datasets/datasets-list-container
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get, computed } from '@ember/object';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';

export default Component.extend({
  tagName: '',

  /**
   * @virtual
   * @type {Function}
   */
  getDataUrl: notImplementedWarn,

  /**
   * @virtual
   * @type {Array<Models.Dataset>}
   */
  datasets: undefined,

  /**
   * Data needed to render info column for ancestor dataset-item
   * @type {ComputedProperty<Object>}
   */
  dataList: computed('datasets.@each.{rootFile,rootFilePath}', function dataList() {
    const {
      datasets,
      getDataUrl,
    } = this.getProperties('datasets', 'getDataUrl');
    // datasets list provided by backend is always sorted from nearest parent to farest
    // in ancestor datasets list we need reverse order
    const datasetsArray = datasets.toArray ? datasets.toArray() : Array.from(datasets);
    return datasetsArray.reverse().map(dataset => {
      const fileId = dataset.relationEntityId('rootFile');
      const filePathString = get(dataset, 'rootFilePath');
      return {
        dataset,
        fileId,
        filePathString,
        fileHref: getDataUrl({ fileId: null, selected: [fileId] }),
      };
    });
  }),
});
