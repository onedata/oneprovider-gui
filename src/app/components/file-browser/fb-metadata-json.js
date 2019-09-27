import Component from '@ember/component';
import { computed } from '@ember/object';
import JsBeautify from 'npm:js-beautify';
import _ from 'lodash';

export default Component.extend({
  metadata: undefined,

  isValid: true,

  validationError: null,

  jsonString: computed('metadata', function jsonString() {
    const metadata = this.get('metadata');
    if (metadata == null) {
      return '';
    } else {
      return JsBeautify.js_beautify(JSON.stringify(metadata));
    }
  }),

  actions: {
    jsonStringChanged(value) {
      try {
        const jsonObject = JSON.parse(value);
        this.set('validationError', null);
        this.get('metadataChanged')({
          metadata: _.cloneDeep(jsonObject),
          isValid: true,
        });
      } catch (error) {
        this.set('validationError', error.toString());
        this.get('metadataChanged')({
          isValid: false,
        });
      }
    },
  },
});
