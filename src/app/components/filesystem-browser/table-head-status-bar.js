/**
 * Implementation of header status part of table for filesystem-browser.
 *
 * @module components/filesystem-browser/table-head-status-bar
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  // FIXME: maybe base class
  classNames: [
    'file-status-bar',
    'filesystem-table-head-status-bar',
  ],

  currentUser: service(),
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.filesystemBrowser.tableHeadStatusBar',

  /**
   * @virtual
   */
  browserModel: undefined,

  /**
   * @virtual
   */
  invokeFileAction: undefined,

  /**
   * @type {String}
   */
  inheritedIcon: 'inheritance',

  file: reads('browserModel.dir'),

  /**
   * If set to true, tags will not provide actions on click.
   * @type {ComputedProperty<Boolean>}
   */
  disabled: reads('browserModel.disableStatusBar'),

  previewMode: reads('browserModel.previewMode'),
});
