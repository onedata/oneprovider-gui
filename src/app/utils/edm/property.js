import EmberObject, { computed } from '@ember/object';

const attrNamespaces = {
  resource: 'rdf',
  lang: 'xml',
  about: 'rdf',
};

const EdmProperty = EmberObject.extend({
  /**
   * @virtual
   */
  value: undefined,

  /**
   * @virtual
   */
  attrs: undefined,

  /**
   * @virtual
   */
  namespace: undefined,

  /**
   * @virtual
   */
  edmPropertyType: undefined,

  shownAttrs: Object.freeze(['resource', 'lang', 'about']),

  objectTypes: Object.freeze([]),

  xmlTagName: computed('namespace', 'edmPropertyType', function xmlTagName() {
    return `${this.namespace}:${this.edmPropertyType}`;
  }),

  init() {
    this._super(...arguments);
    if (!this.attrs) {
      this.set('attrs', {});
    }
  },

  /**
   * @param {boolean} withXmlNs If true, generate mapping with keys having XML namespacs
   *   for attributes, eg. `xml:lang` instead of `lang`.
   * @returns {Object}
   */
  getFilledAttrs(withXmlNs = false) {
    return this.shownAttrs.reduce((resultMap, attrName) => {
      const value = this.attrs[attrName];
      if (value) {
        const effAttrName = (withXmlNs && attrNamespaces[attrName]) ?
          `${attrNamespaces[attrName]}:${attrName}` : attrName;
        resultMap[effAttrName] = value;
      }
      return resultMap;
    }, {});
  },

  // FIXME: test: umożliwić dowolne property

  // FIXME: może tutaj string albo sparsowany Node
  xmlSource: '',
});

export default EdmProperty;
