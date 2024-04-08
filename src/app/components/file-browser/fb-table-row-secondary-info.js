/**
 * Base class for secondary text container displayed under main item name with "secondary"
 * style.
 * Used only in desktop browser mode! In mobile mode, `table-row-mobile-secondary-info` will be
 * displayed in second line.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { inject as service } from '@ember/service';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';

export default Component.extend(I18n, {
  classNames: [
    'fb-table-row-secondary-info',
    'file-info-secondary',
  ],

  i18n: service(),

  // TODO: VFS-7643 maybe something like table-row model will be better than separated
  // props currently row and table states are injected as separate fields (splitted to
  // regions here)

  //#region row state

  /**
   * @virtual
   * @type {Object} browsable item like file; named "file" because lack of general
   *   refactor, to be consistent with non-refactored code
   */
  item: undefined,

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
   * @virtual
   * @type {Function}
   */
  invokeFileAction: notImplementedThrow,

  //#endregion
});
