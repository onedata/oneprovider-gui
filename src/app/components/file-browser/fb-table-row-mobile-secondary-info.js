/**
 * Additional information about file, other than name, for use in mobile mode
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { inject as service } from '@ember/service';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';

export default Component.extend(I18n, {
  tagName: 'div',
  classNames: ['fb-table-row-mobile-secondary-info', 'file-info-mobile'],

  i18n: service(),

  // TODO: VFS-7643 maybe something like table-row model will be better than separated props
  // currently row and table states are injected as separate fields (splitted to regions here)

  //#region row state

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  nameConflict: false,

  /**
   * @virtual
   * @type {Object}
   */
  fileRowModel: undefined,

  //#endregion

  //#region browser state/API

  /**
   * @virtual
   * @type {Utils.BaseBrowserModel}
   */
  browserModel: undefined,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  previewMode: false,

  /**
   * @virtual
   * @type {Function}
   */
  invokeFileAction: notImplementedThrow,

  //#endregion
});
