/**
 * Loads and shows image (or load error message) from reference (intended to use with
 * special EDM property)
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';

export default Component.extend(I18n, {
  classNames: ['visual-edm-image-reference'],

  i18nPrefix: 'components.visualEdm.imageReference',

  /**
   * @virtual
   * @type {string}
   */
  reference: undefined,

  /**
   * @type {Event}
   */
  loadError: null,

  actions: {
    handleImageLoaded() {
      this.set('loadError', null);
    },
    handleImageLoadError(error) {
      this.set('loadError', error);
    },
  },
});
