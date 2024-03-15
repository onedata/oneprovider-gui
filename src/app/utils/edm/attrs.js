// FIXME: doc - attry można usuwać za pomocą ustawiania null/undefined

const attrNamespaces = {
  resource: 'rdf',
  lang: 'xml',
  about: 'rdf',
};

export function namespacedAttr(attrName) {
  const namespace = attrNamespaces[attrName];
  return namespace ? `${namespace}:${attrName}` : attrName;
}

export default class EdmAttrs {
  /**
   * @param {Element} xmlElement
   */
  constructor(xmlElement) {
    this.__xmlElement = xmlElement;
    return new Proxy(this, {
      get(target, name) {
        if (typeof name !== 'string') {
          return undefined;
        }
        if (name === '__xmlElement') {
          return target.__xmlElement;
        } else if (name === 'xmlAttributes') {
          return target.xmlAttributes;
        } else {
          return target.__xmlElement.getAttribute(namespacedAttr(name));
        }
      },
      set(target, name, value) {
        if (name === '__xmlElement') {
          target.__xmlElement = value;
        } else {
          if (value == null) {
            target.__xmlElement.removeAttribute(namespacedAttr(name));
          } else {
            target.__xmlElement.setAttribute(namespacedAttr(name), value);
          }
        }
        return true;
      },
    });
  }

  get xmlAttributes() {
    return this.__xmlElement.attributes;
  }
}
