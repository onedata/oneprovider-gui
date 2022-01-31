/**
 * Conditionally display "Recalled" file tag for files that recall from archive
 * have been finished (successfully or not).
 *
 * @module components/filesystem-browser/tag-recalled
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  tagName: '',

  /**
   * @override
   */
  i18nPrefix: 'components.filesystemBrowser.tagRecalled',

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  disabled: false,

  /**
   * @virtual
   * @type () => void
   */
  onTagClicked: undefined,

  actions: {
    tagClicked() {
      this.get('onTagClicked')();
    },
  },
});
