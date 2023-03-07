/**
 * A service that provides method to extract oneprovider-specific error messages
 * from passed backend errors.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import ErrorExtractor from 'onedata-gui-common/services/error-extractor';
import getErrorDescription from 'onedata-gui-common/utils/get-error-description';

export default ErrorExtractor.extend({
  /**
   * @override
   */
  extractorFunction: getErrorDescription,

  /**
   * @param {*} error
   * @returns {string}
   */
  getType(error) {
    const errorId = (error || {}).id;
    switch (errorId) {
      case 'posix':
        return error.details && error.details.errno === 'eacces' ? 'forbidden' : 'error';
      case 'forbidden':
        return 'forbidden';
      default:
        return 'error';
    }
  },
});
