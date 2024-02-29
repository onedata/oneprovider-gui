import EmberObject, { computed } from '@ember/object';
import { classify } from '@ember/string';
/**
 * @typedef {Object} EdmObjectAttrs
 * @property {string} about Mandatory `rdf:about` property.
 */

export const EdmObjectType = {
  Aggregation: 'aggregation',
  ProvidedCho: 'providedCho',
  WebResource: 'webResource',
};

const EdmObject = EmberObject.extend({
  /**
   * @type {EdmObjectAttrs}
   */
  attrs: undefined,

  /**
   * @type {Array<EdmProperty>}
   */
  edmProperties: undefined,

  /**
   * @virtual
   */
  edmObjectType: undefined,

  /**
   * @virtual
   */
  xmlNamespace: undefined,

  xmlTagName: computed('xmlNamespace', 'edmObjectType', function xmlTagName() {
    return `${this.xmlNamespace}:${classify(this.edmObjectType)}`;
  }),

  shownAttrs: Object.freeze(['about']),

  init() {
    this._super(...arguments);
    if (!this.attrs) {
      this.set('attrs', {
        about: '',
      });
    }
    if (!Array.isArray(this.edmProperties)) {
      this.set('edmProperties', []);
    }
  },

  addEdmProperty(edmProperty) {
    this.edmProperties.push(edmProperty);
  },
});

export default EdmObject;
