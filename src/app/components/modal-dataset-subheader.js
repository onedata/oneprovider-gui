/**
 * Subheader for dataset-operation modals with dataset(s) name.
 * It's a special version of `modal-file-subheader` aimed for datasets.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { alias } from '@ember/object/computed';
import { raw, or, conditional } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/i18n';
import ModalFileSubheader from 'oneprovider-gui/components/modal-file-subheader';
import layout from 'oneprovider-gui/templates/components/modal-file-subheader';

export default ModalFileSubheader.extend(I18n, {
  layout,

  /**
   * @virtual
   * @type {Array<Utils.BrowsableDataset>}
   */
  datasets: alias('files'),

  /**
   * @type {ComputedProperty<Utils.BrowsableDataset>}
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
