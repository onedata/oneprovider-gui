/**
 * Renders column modification popover.
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  tagName: '',
  classNames: ['column-modification-popover'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.columnModificationPopover',

  /**
   * @virtual
   * @type {String}
   */
  triggerSelector: undefined,

  /**
   * @virtual
   * @type {Utils.FilesystemBrowserModel}
   */
  browserModel: undefined,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  isOpened: false,

  actions: {
    checkboxChanged(property, newValue) {
      this.browserModel.changeColumnVisibility(property, newValue);
    },
  },
});
