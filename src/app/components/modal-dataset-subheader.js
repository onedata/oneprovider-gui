/**
 * Subheader for dataset-operation modals with dataset(s) name.
 * It's a special version of `modal-file-subheader` aimed for datasets.
 *
 * @module components/modal-dataset-subheader
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { alias } from '@ember/object/computed';
import { raw, or, conditional } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import ModalFileSubheader from 'oneprovider-gui/components/modal-file-subheader';
import layout from 'oneprovider-gui/templates/components/modal-file-subheader';

export default ModalFileSubheader.extend(I18n, {
  layout,
  tagName: 'h2',

  /**
   * @virtual
   * @type {Array<Model.Dataset>}
   */
  datasets: alias('files'),

  /**
   * @type {ComputedProperty<Models.Dataset>}
   */
  firstDataset: alias('firstFile'),

  /**
   * @override
   */
  type: conditional(
    'multi',
    raw('multi'),
    or('firstDataset.rootFileType', raw('dir'))
  ),

  /**
   * @override
   */
  fileIcon: 'browser-dataset-file',

  /**
   * @override
   */
  dirIcon: 'browser-dataset',
});
