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
import { EdmPropertyValueType, allSpecs } from './property-spec';
import EdmMetadata from './metadata';

/**
 * @typedef {Object} EdmPropertyOptions
 * @property {string} [value] Value of element.
 * @property {string} [resource] `rdf:resource` attribute of element.
 * @property {string} [lang] `xml:lang` attribute of element.
 * @property {string} [about] `rdf:about` attribute of element.
 */

export default class EdmPropertyFactory {
  /**
   * @param {Element} xmlElement
   * @returns {EdmProperty}
   */
  static createPropertyFromXmlElement(xmlElement) {
    const [namespace, propertyName] = xmlElement.tagName.split(':');
    const spec = allSpecs[namespace]?.[propertyName];
    return new EdmProperty({
      xmlElement,
      spec,
    });
  }

  constructor(metadata) {
    if (!metadata || !(metadata instanceof EdmMetadata)) {
      throw new Error(
        'EdmPropertyFactory needs EdmMetadata to be provided in constructor'
      );
    }
    /**
     * @type {EdmMetadata}
     */
    this.metadata = metadata;
  }

  /**
   * @param {EdmMetadata} edmMetadata
   * @param {EdmPropertyNamespace} namespace
   * @param {EdmPropertyName} propertyName
   * @param {EdmPropertyOptions} options
   * @returns {Utils.Edm.Property}
   */
  createProperty(namespace, propertyName, options = {}) {
    const spec = allSpecs[namespace]?.[propertyName] || {};
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
    return edmProperty;
  }
}
