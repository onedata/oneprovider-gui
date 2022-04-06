/**
 * Base service for generating API URLs for various operations in Onedata.
 *
 * @module services/api-string-generator
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { get } from '@ember/object';
import { reads } from '@ember/object/computed';
import pupa from 'npm:pupa';
import shellEscape from 'npm:shell-escape';

export default Service.extend({
  /**
   * - Keys: template names equal to name of corresponding REST method.
   * - Values: templates parseable with `pupa` library.
   * @type {ComputedProperty<Object>}
   */
  apiTemplates: reads(''),

  /**
   * Type of API from `apiTemplates`, eg. rest, xrootd
   * @virtual
   * @type {String}
   */
  apiType: undefined,

  fillTemplate(templateName, templateParams) {
    const {
      apiTemplates,
      apiType,
    } = this.getProperties('apiTemplates', 'apiType');
    const template = get(apiTemplates, `${apiType}.${templateName}`);
    if (template) {
      if (typeof template === 'string') {
        return pupa(template, templateParams);
      } else if (Array.isArray(template)) {
        return shellEscape(template.map(arg => pupa(arg, templateParams)));
      } else {
        return '';
      }

    } else {
      console.error(
        `service:api-string-generator#fillTemplate: no template named ${templateName}`
      );
      return '';
    }
  },
});
