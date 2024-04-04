/**
 * Visual editor for Open Data metadata in Europeana Data Model format
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: [
    'visual-edm',
  ],
  classNameBindings: [
    'viewModel.isReadOnly:readonly',
  ],

  i18nPrefix: 'components.visualEdm',

  /**
   * @type {VisualEdmViewModel}
   * @virtual
   */
  viewModel: undefined,

  actions: {
    addWebResource() {
      this.viewModel.addWebResource();
    },
  },
});
