/**
 * Status bar section with tags for item row
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { inject as service } from '@ember/service';
import { reads, or } from '@ember/object/computed';

export default Component.extend(I18n, {
  tagName: 'div',
  classNames: ['fb-table-row-status-bar', 'file-status-bar'],

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
   * A draft of row model(many properties placed in one object), see TODO: VFS-7643
   * @virtual
   * @type {Object}
   */
  fileRowModel: Object.freeze({}),

  /**
   * @virtual optional
   * @type {Boolean}
   */
  nameConflict: false,

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

  /**
   * @type {ComputedProperty<boolean>}
   */
  isSpaceOwned: reads('browserModel.isSpaceOwned'),

  /**
   * @type {ComputedProperty<SpacePrivileges>}
   */
  spacePrivileges: reads('browserModel.spacePrivileges'),

  /**
   * @type {ComputedProperty<boolean>}
   */
  previewMode: reads('browserModel.previewMode'),

  /**
   * Name of icon to indicate that some property in tag is inhertied from ancestor
   * @type {String}
   */
  inheritedIcon: 'inheritance',

  /**
   * If set to true, tags will not provide actions on click.
   * @type {ComputedProperty<Boolean>}
   */
  isEffDisabled: or('disabled', 'browserModel.disableStatusBar'),
});
