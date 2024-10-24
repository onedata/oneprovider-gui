/**
 * Renders columns configuration icon with popover.
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { inject as service } from '@ember/service';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default Component.extend(I18n, {
  tagName: 'th',
  classNames: ['columns-configuration-cell', 'hidden-xs'],
  classNameBindings: [
    'isDropBorderShown:border-dashed',
  ],

  i18n: service(),
  media: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.columnsConfigurationCell',

  /**
   * @virtual
   * @type {Utils.ColumnsConfiguration}
   */
  columnsConfiguration: undefined,

  /**
   * @virtual
   * @type {Utils.FilesystemBrowserModel}
   */
  browserModel: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  dragStartAction: notImplementedIgnore,

  /**
   * @virtual
   * @type {Function}
   */
  dragEndAction: notImplementedIgnore,

  actions: {
    headingDragOverAction(event) {
      this.headingDragOverAction(event);
    },
    headingDragLeaveAction(event) {
      this.headingDragLeaveAction(event);
    },
    headingDropAction(event) {
      this.headingDropAction(event);
    },
  },
});
