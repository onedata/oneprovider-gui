/**
 * A modal for single item in dataset browser showing protection settings of dataset
 * hierarchy.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual
   * @type {Utils.BrowsableDataset}
   */
  browsableDataset: undefined,

  /**
   * One of: file, dataset.
   * - file: suitable for filesystem-browser, show info about ancestors
   *     in filesystem context
   * - dataset: suitable for dataset-browser, show info about ancestors
   *     in dataset tree context
   * @virtual optional
   * @type {String}
   */
  mode: 'file',

  actions: {
    onHide() {
      this.get('onHide')();
    },
  },
});
