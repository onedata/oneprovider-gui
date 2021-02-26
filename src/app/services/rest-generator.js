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
    return this.fillTemplate('listSharedDirectoryChildren', { id: cdmiObjectId });
  },

  downloadSharedFileContent(cdmiObjectId) {
    return this.fillTemplate('downloadSharedFileContent', { id: cdmiObjectId });
  },

  fillTemplate(templateName, templateParams) {
    const restTemplates = this.get('restTemplates');
    const template = get(restTemplates, templateName);
    if (!template) {
      console.error(
        'util:rest-generator#fillTemplate: no template named ${templateName}'
      );
      return '';
    }
    return pupa(template, templateParams);
  },
});
