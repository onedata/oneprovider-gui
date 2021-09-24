/**
 * Button select group used for switching displayed AIP/DIP archive.
 *
 * @module components/archive-filesystem-browser/dip-switch
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  tagName: '',

  /**
   * @override
   */
  i18nPrefix: 'components.archiveFilesystemBrowser.dipSwitch',

  /**
   * @virtual optional
   * @type {Boolean}
   */
  disabled: false,

  /**
   * One of: aip, dip.
   * @virtual
   * @type {String}
   */
  archiveDipMode: undefined,

  /**
   * @virtual
   * @type {(archiveDipMode: String) => any}
   */
  onArchiveDipModeChange: notImplementedThrow,
});
