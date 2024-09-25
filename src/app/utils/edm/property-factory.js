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
import EdmObjectType, { EdmObjectTagName } from './object-type';
import { get } from '@ember/object';
import bytesToString from 'onedata-gui-common/utils/bytes-to-string';

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

    // optional properties

    /**
     * Add a reference to share.rootFile to be able to set default value for file size
     * property. If this property is not set - file size will have an undefined default
     * value.
     * @type {Models.File}
     */
    this.shareRootFile = undefined;
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
    } else {
      this.setDefaultValue(edmProperty);
    }
    const attrs = _.cloneDeep(options);
    delete attrs.value;
    edmProperty.attrs = attrs;
    if (typeof spec.lang === 'string' && typeof options.lang !== 'string') {
      edmProperty.lang = spec.lang;
    }
    return edmProperty;
  }

  /**
   * Modifies the property instance to have a default value from spec.
   * @param {EdmProperty} edmProperty
   * @returns {EdmProperty}
   */
  setDefaultValue(edmProperty) {
    let value;
    if (
      edmProperty.spec.obj === EdmObjectType.WebResource &&
      edmProperty.xmlTagName === 'dcterms:extent' &&
      this.shareRootFile
    ) {
      const bytes = get(this.shareRootFile, 'size') ?? 0;
      value = bytesToString(bytes, { format: 'windows' });
    } else if (edmProperty.spec.def) {
      value = edmProperty.spec.def;
    }
    if (value != null) {
      edmProperty.setSupportedValue(value);
    }
    return edmProperty;
  }
}
