/**
 * Renders truncated description of archive with secondary info classes for browser row.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  tagName: '',

  /**
   * @override
   */
  i18nPrefix: 'components.archiveBrowser.secondaryDescription',

  /**
   * @virtual
   * @type {Models.Archive}
   */
  archive: undefined,
});
