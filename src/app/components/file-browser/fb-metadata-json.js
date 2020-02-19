/**
 * Content for JSON metadata tab in file metadata modal: JSON editor
 * 
 * @module components/file-browser/fb-metadata-json
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import _ from 'lodash';
import { emptyValue } from 'oneprovider-gui/components/file-browser/fb-metadata-modal';

export default Component.extend({
  /**
   * @virtual
   * @type {Object}
   */
  metadata: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  metadataChanged: undefined,

  validationError: null,

  jsonString: computed('metadata', function jsonString() {
    const metadata = this.get('metadata');
    if (metadata === emptyValue) {
      return '';
    } else {
      return JSON.stringify(metadata, null, 2);
    }
  }),

  actions: {
    jsonStringChanged(value) {
      const metadataChanged = this.get('metadataChanged');
      try {
        const jsonObject = JSON.parse(value);
        this.set('validationError', null);
        metadataChanged({
          metadata: _.cloneDeep(jsonObject),
          isValid: true,
        });
      } catch (error) {
        if (value === '') {
          this.set('validationError', null);
          metadataChanged({
            metadata: emptyValue,
            isValid: true,
          });
        } else {
          this.set('validationError', error.toString());
          metadataChanged({
            isValid: false,
          });
        }
      }
    },
  },
});
