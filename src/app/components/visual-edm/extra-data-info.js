/**
 * Simple information about extra data in the XML source which is not included in the
 * visual editor/viewer.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['visual-edm-extra-data-info', 'edm-info-row', 'info'],

  /**
   * @override
   */
  i18nPrefix: 'components.visualEdm.extraDataInfo',

  /**
   * @virtual
   * @type {EdmMetadata|EdmObject|EdmProperty}
   */
  model: undefined,
});
