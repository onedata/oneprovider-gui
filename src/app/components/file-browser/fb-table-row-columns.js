/**
 * Columns other than "name" for desktop mode browser
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import { reads } from '@ember/object/computed';

export default Component.extend(I18n, {
  tagName: '',

  /**
   * @virtual
   * @type {Object}
   */
  browserModel: undefined,

  // TODO: VFS-7643 maybe something like table-row model will be better than separated props

  /**
   * @virtual
   * @type {any} browsable object like Models.File
   */
  file: undefined,

  /**
   * @virtual
   * @type {Boolean}
   */
  previewMode: undefined,

  /**
   * @virtual
   * @type {Boolean}
   */
  nameConflict: undefined,

  /**
   * @virtual
   * @type {Object}
   */
  fileRowModel: undefined,

  /**
   * @virtual
   * @type {(item: any, actionName: string) => void}
   */
  invokeFileAction: notImplementedReject,

  /**
   * @type {ComputedProperty<Utils.ColumnsConfiguration>}
   */
  columnsConfiguration: reads('browserModel.columnsConfiguration'),
});
