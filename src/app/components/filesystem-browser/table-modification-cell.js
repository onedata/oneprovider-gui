/**
 * Filesystem - specific browser table cell for modification.
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import layout from 'oneprovider-gui/templates/components/filesystem-browser/table-modification-cell';

export default Component.extend({
  layout,

  /**
   * @override
   */
  i18nPrefix: 'components.filesystemBrowser.tableSizeCell',

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual
   * @type {DirStatsServiceState}
   */
  dirStatsServiceState: undefined,
});
