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
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';

export default Component.extend(I18n, {
  tagName: 'th',
  classNames: ['columns-configuration-cell', 'hidden-xs'],

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
   * @type {Function}
   */
  dragStartAction: notImplementedWarn,

  /**
   * @virtual
   * @type {Function}
   */
  dragEndAction: notImplementedWarn,
});
