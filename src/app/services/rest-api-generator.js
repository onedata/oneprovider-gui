/**
 * Provides utils for generating REST commands for various operations in Onedata.
 * 
 * Method names in this service are mainly names of corresponding operation names
 * from Onedata API. See REST API documentation (eg. on https://onedata.org/#/home/api)
 * for details or browse one of Swagger definitions (eg.
 * https://github.com/onedata/oneprovider-swagger).
 *
 * @module services/rest-api-generator
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import ApiStringGenerator from 'oneprovider-gui/services/api-string-generator';

export default ApiStringGenerator.extend({
  /**
   * @override
   */
  apiType: 'rest',

  listSharedDirectoryChildren({ cdmiObjectId }) {
    return this.fillTemplate('listSharedDirectoryChildren', { id: cdmiObjectId });
  },

  downloadSharedFileContent({ cdmiObjectId }) {
    return this.fillTemplate('downloadSharedFileContent', { id: cdmiObjectId });
  },

  downloadSharedDirectoryContent({ cdmiObjectId }) {
    // Using the same template as in `downloadSharedFileContent`
    return this.fillTemplate('downloadSharedFileContent', { id: cdmiObjectId });
  },

  getSharedFileAttributes({ cdmiObjectId }) {
    return this.fillTemplate('getSharedFileAttributes', { id: cdmiObjectId });
  },

  getSharedFileJsonMetadata({ cdmiObjectId }) {
    return this.fillTemplate('getSharedFileJsonMetadata', { id: cdmiObjectId });
  },

  getSharedFileRdfMetadata({ cdmiObjectId }) {
    return this.fillTemplate('getSharedFileRdfMetadata', { id: cdmiObjectId });
  },

  getSharedFileExtendedAttributes({ cdmiObjectId }) {
    return this.fillTemplate('getSharedFileExtendedAttributes', { id: cdmiObjectId });
  },

  curlize(url, curlOptions) {
    return `curl${curlOptions? ' ' + curlOptions : ''} ${url}`;
  },
});
