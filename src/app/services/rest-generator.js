/**
 * Provides utils for generating REST URLs for various operations in Onedata.
 * 
 * Method names in this service are mainly names of corresponding operation names
 * from Onedata API. See REST API documentation (eg. on https://onedata.org/#/home/api)
 * for details or browse one of Swagger definitions (eg.
 * https://github.com/onedata/oneprovider-swagger).
 *
 * @module services/rest-generator
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { get } from '@ember/object';
import pupa from 'npm:pupa';

export default Service.extend({
  onedataConnection: service(),

  /**
   * - Keys: template names equal to name of corresponding REST method.
   * - Values: templates parseable with `pupa` library.
   * @type {ComputedProperty<Object>}
   */
  restTemplates: reads('onedataConnection.restTemplates'),

  listSharedDirectoryChildren(cdmiObjectId) {
    return this.getSharedDataCurl('listSharedDirectoryChildren', cdmiObjectId);
  },

  downloadSharedFileContent(cdmiObjectId) {
    return this.getSharedDataCurl('downloadSharedFileContent', cdmiObjectId);
  },

  getSharedFileAttributes(cdmiObjectId) {
    return this.getSharedDataCurl('getSharedFileAttributes', cdmiObjectId);
  },

  getSharedFileJsonMetadata(cdmiObjectId) {
    return this.getSharedDataCurl('getSharedFileJsonMetadata', cdmiObjectId);
  },

  getSharedFileRdfMetadata(cdmiObjectId) {
    return this.getSharedDataCurl('getSharedFileRdfMetadata', cdmiObjectId);
  },

  getSharedFileExtendedAttributes(cdmiObjectId) {
    return this.getSharedDataCurl('getSharedFileExtendedAttributes', cdmiObjectId);
  },

  curlize(url, curlOptions) {
    return `curl${curlOptions? ' ' + curlOptions : ''} ${url}`;
  },

  fillTemplate(templateName, templateParams) {
    const restTemplates = this.get('restTemplates');
    const template = get(restTemplates, templateName);
    if (template) {
      return pupa(template, templateParams);
    } else {
      console.error(
        `util:rest-generator#fillTemplate: no template named ${templateName}`
      );
      return '';
    }
  },

  curlFromTemplate(templateName, templateParams, curlOptions) {
    const url = this.fillTemplate(templateName, templateParams);
    if (url) {
      return this.curlize(url, curlOptions);
    } else {
      console.error(
        `util:rest-generator#curlFromTemplate: empty URL generator for ${templateName}`
      );
      return '';
    }
  },

  getSharedDataCurl(path, cdmiObjectId) {
    return this.curlFromTemplate(path, { id: cdmiObjectId }, '-L');
  },
});
