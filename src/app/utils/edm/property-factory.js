/**
 * Produces `EdmProperty` instances from provided data or XML elements (parts of EDM XML
 * metadata document).
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EdmProperty from './property';
import _ from 'lodash';
import { getTagToPropertyDataMap } from './property-spec';
import EdmMetadata from './metadata';
import { EdmObjectTagName } from './object-type';

/**
 * @typedef {Object} EdmPropertyOptions
 * @property {string} [value] Value of element.
 * @property {string} [resource] `rdf:resource` attribute of element.
 * @property {string} [lang] `xml:lang` attribute of element.
 * @property {string} [about] `rdf:about` attribute of element.
 */

export default class EdmPropertyFactory {
  /** @type {EdmMetadata} */
  #metadata = undefined;
  /** @type {EdmObjectType} */
  #edmObjectType = undefined;
  /** @type {string} */
  #edmObjectTagName = undefined;

  /**
   * @param {Element} xmlElement
   * @returns {EdmProperty}
   */
  static createPropertyFromXmlElement(xmlElement) {
    const parentTag = xmlElement.parentElement.tagName;
    const spec = getTagToPropertyDataMap()[parentTag][xmlElement.tagName]?.spec;
    return new EdmProperty({
      xmlElement,
      spec,
    });
  }

  constructor(metadata, edmObjectType) {
    if (!metadata || !(metadata instanceof EdmMetadata)) {
      throw new Error(
        'EdmPropertyFactory needs EdmObject to be provided in constructor'
      );
    }
    if (!edmObjectType) {
      throw new Error(
        'EdmPropertyFactory needs EdmObjectType to be provided in constructor'
      );
    }

    this.#metadata = metadata;
    this.#edmObjectType = edmObjectType;
    this.#edmObjectTagName = EdmObjectTagName[this.#edmObjectType];
  }

  get metadata() {
    return this.#metadata;
  }

  get edmObjectType() {
    return this.#edmObjectType;
  }

  get objectTag() {
    return this.#edmObjectTagName;
  }

  /**
   * @param {EdmPropertyNamespace} namespace
   * @param {EdmPropertyName} propertyName
   * @param {EdmPropertyOptions} options
   * @returns {Utils.Edm.Property}
   */
  createProperty(namespace, propertyName, options = {}) {
    const propertyTag = `${namespace}:${propertyName}`;
    const spec = getTagToPropertyDataMap()[this.objectTag][propertyTag]?.spec || {};
    const edmProperty = new EdmProperty({
      xmlDocument: this.metadata.xmlDocument,
      namespace,
      edmPropertyType: propertyName,
      spec,
    });
    if (options.value) {
      edmProperty.value = options.value;
    } else if (spec.def) {
      edmProperty.setSupportedValue(spec.def);
    }
    const attrs = _.cloneDeep(options);
    delete attrs.value;
    edmProperty.attrs = attrs;
    if (typeof spec.lang === 'string' && typeof options.lang !== 'string') {
      edmProperty.lang = spec.lang;
    }
    return edmProperty;
  }
}
