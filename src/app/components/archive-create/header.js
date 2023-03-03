/**
 * Header for archive properties editor component
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['archive-create-header'],

  /**
   * @override
   */
  i18nPrefix: 'components.archiveCreate.header',

  /**
   * @virtual
   * @type {Models.Dataset}
   */
  dataset: undefined,
});
