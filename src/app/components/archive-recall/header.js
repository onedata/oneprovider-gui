/**
 * Header for archive properties editor component
 *
 * @module components/archive-recall/header
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['archive-recall-header'],

  /**
   * @override
   */
  i18nPrefix: 'components.archiveRecall.header',

  /**
   * @virtual
   * @type {Models.Dataset}
   */
  archive: undefined,
});
