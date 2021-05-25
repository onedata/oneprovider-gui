/**
 * Header for archive properties editor component 
 *
 * @module components/archive-settings/header
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['archive-settings-header'],

  /**
   * @override
   */
  i18nPrefix: 'components.archiveSettings.header',

  /**
   * @virtual
   * @type {Models.Dataset}
   */
  dataset: undefined,
});
