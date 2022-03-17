/**
 * Handles no permissions to view (posix eperm) error or shows generic error view.
 *
 * @module components/archive-browser/dir-load-error
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get, computed } from '@ember/object';
import { createPrivilegeExpression } from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  tagName: '',

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveBrowser.dirLoadError',

  /**
   * Error object from backend as used in `components/file-browser/fb-dir-load-error`.
   * @virtual
   * @type {Object}
   */
  dirLoadError: undefined,

  viewPrivilegeExpression: computed(function viewPrivilegeExpression() {
    const i18n = this.get('i18n');
    return createPrivilegeExpression(i18n, 'space', 'space_view_archives');
  }),

  isPrivilegesError: computed(function isPrivilegeError() {
    const reason = this.get('dirLoadError');
    return reason &&
      get(reason, 'id') === 'posix' &&
      get(reason, 'details.errno') === 'eperm';
  }),
});
