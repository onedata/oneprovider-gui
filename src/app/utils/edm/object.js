import EmberObject, { computed } from '@ember/object';
import { classify } from '@ember/string';
/**
 * @typedef {Object} EdmObjectAttrs
 * @property {string} about Mandatory `rdf:about` property.
 */

const EdmObject = EmberObject.extend({
  /**
   * @type {EdmObjectAttrs}
   */
  attrs: undefined,

  /**
   * @type {Array<Utils.Edm.Property>}
   */
  edmProperties: undefined,

  /**
   * @virtual
   * @type {EdmObjectType}
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
