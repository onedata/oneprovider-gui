/**
 * Provides data for rendering list of dataset-items with ancestor datasets.
 *
 * @module components/dataset-protection/datasets-list-container
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import { promise } from 'ember-awesome-macros';
import { all as allFulfilled } from 'rsvp';

export default Component.extend({
  tagName: '',

  /**
   * @virtual
   * @type {Function}
   */
  getDataUrl: notImplementedWarn,

  /**
   * @virtual
   * @type {Function}
   */
  getDatasetsUrl: notImplementedWarn,

  /**
   * @virtual
   * @type {Array<Models.Dataset>}
   */
  datasets: undefined,

  /**
   * File-datasets view mode. See `dataset-protection` for details.
   * @virtual optional
   * @type {String}
   */
  mode: 'file',

  /**
   * Data needed to render info column for ancestor dataset-item
   * @type {ComputedProperty<Object>}
   */
  dataListProxy: promise.object(computed(
    'getDataUrl',
    'getDatasetsUrl',
    'mode',
    'datasets.@each.{rootFile,rootFilePath}',
    async function dataListProxy() {
      const {
        datasets,
        mode,
        getDataUrl,
        getDatasetsUrl,
      } = this.getProperties('datasets', 'mode', 'getDataUrl', 'getDatasetsUrl');
      const getUrl = mode === 'dataset' ? getDatasetsUrl : getDataUrl;
      // datasets list provided by backend is always sorted from nearest parent to farest
      // in ancestor datasets list we need reverse order
      const datasetsArray = datasets.toArray ? datasets.toArray() : Array.from(datasets);
      return await allFulfilled(datasetsArray.reverse().map(async (dataset) => {
        const itemId = mode === 'dataset' ?
          get(dataset, 'entityId') : dataset.relationEntityId('rootFile');
        const itemPathString = await this.getPathString(dataset);
        return {
          dataset,
          itemPathString,
          itemHref: await getUrl({ selected: [itemId] }),
        };
      }));
    }
  )),

  dataList: reads('dataListProxy.content'),

  async getPathString(dataset) {
    if (this.get('mode') === 'file') {
      return get(dataset, 'rootFilePath');
    } else {
      return stringifyFilePath(
        await resolveFilePath(dataset), 'name',
        ' › ',
        false
      );
    }
  },
});
