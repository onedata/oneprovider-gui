/**
 * A container for archives browser embedded into file-datasets panel.
 *
 * @module components/file-datasets/archives-tab
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import InModalBrowserContainerBase from 'oneprovider-gui/mixins/in-modal-item-browser-container-base';
import DatasetArchivesBrowser from 'oneprovider-gui/components/dataset-archives-browser';
import layout from 'oneprovider-gui/templates/components/dataset-archives-browser';

const mixins = [
  InModalBrowserContainerBase,
];

export default DatasetArchivesBrowser.extend(...mixins, {
  layout,
  classNames: ['file-datasets-archives-tab'],

  /**
   * Custom selector for items list scroll container.
   * Should be overriden **only** if archives-tab is not in one-modal.
   * @type {String}
   * @virtual optional
   */
  contentScrollSelector: undefined,

  /**
   * @implements InModalBrowserContainerBase
   * @type {String}
   * @virtual
   */
  modalBodyId: undefined,
});
