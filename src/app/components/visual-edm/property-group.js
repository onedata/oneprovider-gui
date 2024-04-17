/**
 * Graphical representation of single/multiple properties with the same type.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/i18n';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  classNames: ['visual-edm-property-group', 'edm-property-group-box'],

  visualEdmTranslation: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.visualEdm.property',

  /**
   * @virtual
   * @type {Utils.VisualEdm.PropertyGroupViewModel}
   */
  viewModel: undefined,

  /**
   * @type {ComputedProperty<SafeString>}
   */
  displayedPropertyName: computed(
    'viewModel.{namespace,edmPropertyType,edmObjectType}',
    function displayedPropertyName() {
      return this.visualEdmTranslation(
        this.viewModel.namespace,
        this.viewModel.edmPropertyType,
        this.viewModel.edmObjectType
      );
    }
  ),
});
