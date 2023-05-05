/**
 * Renders columns configuration icon with popover.
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  tagName: 'th',
  classNames: ['fb-table-col-actions-menu', 'hidden-xs'],

  i18n: service(),
  media: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbConfigurationColumnsCell',

  /**
   * @virtual
   * @type {Utils.FilesystemBrowserModel}
   */
  browserModel: undefined,
});
