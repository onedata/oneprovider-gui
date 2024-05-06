/**
 * A facade for setting attributes on the XML Element using the key-value interface.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

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
  static #gettableOwnPropertySet = new Set(['__xmlElement', 'xmlAttributes']);
  static #settableOwnPropertySet = new Set(['__xmlElement']);

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
        return EdmAttrs.#gettableOwnPropertySet.has(name) ?
          target[name] :
          target.__xmlElement.getAttribute(namespacedAttr(name));
      },
      set(target, name, value) {
        if (EdmAttrs.#settableOwnPropertySet.has(name)) {
          target[name] = value;
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
