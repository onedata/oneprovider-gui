// FIXME: jsdoc

import Component from '@ember/component';
import { get, computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

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
        } else {
          return { message: this.t('unknownError') };
        }
      } else {
        return { message: this.t('uknownError') };
      }
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
});
