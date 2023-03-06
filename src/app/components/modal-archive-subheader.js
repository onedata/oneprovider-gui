/**
 * Subheader for archive-operation modals with archive(s) name.
 * It's a special version of `modal-file-subheader` aimed for archives.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { alias } from '@ember/object/computed';
import { raw, or, conditional } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import ModalFileSubheader from 'oneprovider-gui/components/modal-file-subheader';
import layout from 'oneprovider-gui/templates/components/modal-file-subheader';

export default ModalFileSubheader.extend(I18n, {
  classNames: ['modal-archive-subheader'],
  layout,

  /**
   * @virtual
   * @type {Array<Utils.BrowsableArchive>}
   */
  archives: alias('files'),

  /**
   * @type {ComputedProperty<Utils.BrowsableArchive>}
   */
  firstArchive: alias('firstFile'),

  /**
   * @override
   */
  type: conditional(
    'multi',
    raw('multi'),
    or('firstArchive.type', raw('dir'))
  ),

  /**
   * File type should not be used - setting for fallbasck.
   * @override
   */
  fileIcon: 'browser-archive',

  /**
   * @override
   */
  dirIcon: 'browser-archive',
});
