/**
 * Base implementation of dir load error view for browser
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/i18n';
import { inject as service } from '@ember/service';
import computedT from 'onedata-gui-common/utils/computed-t';

export default Component.extend(I18n, {
  classNames: ['error-dir-box', 'dir-box'],

  errorExtractor: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbDirLoadError',

  /**
   * @virtual
   */
  dirLoadError: undefined,

  /**
   * @virtual
   */
  browserModel: undefined,

  /**
   * @type {ComputedProperty<object>} message object from error extractor
   */
  dirLoadErrorMessage: computed(
    'dirLoadError',
    function dirLoadErrorMessage() {
      const reason = this.get('dirLoadError');
      if (reason) {
        const messageObject = this.get('errorExtractor').getMessage(reason);
        if (messageObject && messageObject.message) {
          return messageObject;
        }
      }
      return { message: this.t('unknownError') };
    }
  ),

  /**
   * If the error is POSIX, returns string posix error code
   * @type {ComputedProperty<string|undefined>}
   */
  dirLoadErrorPosix: computed(
    'dirLoadError.{id,details.errno}',
    function dirLoadErrorPosix() {
      const dirLoadError = this.get('dirLoadError');
      if (get(dirLoadError, 'id') === 'posix') {
        return get(dirLoadError, 'details.errno');
      }
    }
  ),

  previewMode: reads('browserModel.previewMode'),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  navigateToRootButtonLabel: computedT('navigateToRoot'),

  actions: {
    navigateToRoot() {
      return this.browserModel.navigateToRoot();
    },
  },
});
