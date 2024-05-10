/**
 * Graphical representation of single/multiple properties with the same type.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';

export default Component.extend(I18n, {
  classNames: ['visual-edm-property-group', 'edm-property-group-box'],

  /**
   * @override
   */
  i18nPrefix: 'components.visualEdm.property',

  /**
   * @virtual
   * @type {Utils.VisualEdm.PropertyGroupViewModel}
   */
  viewModel: undefined,
});
