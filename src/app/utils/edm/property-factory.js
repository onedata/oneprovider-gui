import EmberObject from '@ember/object';
import EdmProperty from './property';
import _ from 'lodash';
import { EdmPropertyValueType, allSpecs } from './property-spec';

// FIXME: rozróżnienie na property dla różnych obiektów

/**
 * @typedef {Object} EdmPropertyOptions
 * @property {string} [value] Value of element.
 * @property {string} [resource] `rdf:resource` attribute of element.
 * @property {string} [lang] `xml:lang` attribute of element.
 * @property {string} [about] `rdf:about` attribute of element.
 */

const EdmPropertyFactory = EmberObject.extend({
  // FIXME: skoro tutaj operuję na koncepcji modelu to mogę nie wymagać podawania namespace
  // tylko samego property name (namespace będzie wzięte ze specyfikacji)

  // FIXME: zmiast osobno wstrzykiwać wszystkie property podczas konstrukcji, można użyć
  // speców jako

  /**
   * @param {EdmMetadata} edmMetadata
   * @param {EdmPropertyNamespace} namespace
   * @param {EdmPropertyName} propertyName
   * @param {EdmPropertyOptions} options
   * @returns {Utils.Edm.Property}
   */
  createProperty(edmMetadata, namespace, propertyName, options = {}) {
    // FIXME: check / throw error when invalid namespace/name
    const spec = allSpecs[namespace]?.[propertyName];
    const edmProperty = new EdmProperty({
      xmlDocument: edmMetadata.xmlDocument,
      namespace,
      edmPropertyType: propertyName,
      spec,
    });
    if (options.value) {
      edmProperty.value = options.value;
    } else if (spec.def) {
      setPropertyValue(edmProperty, spec.def);
    }
    const attrs = _.cloneDeep(options);
    delete attrs.value;
    edmProperty.attrs = attrs;
    return edmProperty;
  },

  /**
   * @param {Element} xmlElement
   * @returns {EdmProperty}
   */
  createPropertyFromXml(xmlElement) {
    const [namespace, propertyName] = xmlElement.tagName.split(':');
    const spec = allSpecs[namespace]?.[propertyName];
    return new EdmProperty({
      xmlElement,
      spec,
    });
  },
});

export default EdmPropertyFactory;

/**
 * @param {EdmProperty} property
 * @param {string} value
 */
export function setPropertyValue(property, value) {
  switch (property.supportedValueType) {
    case EdmPropertyValueType.Any:
    case EdmPropertyValueType.Literal:
      property.value = value;
      break;
    case EdmPropertyValueType.Reference:
      property.attrs.resource = value;
      break;
    default:
      break;
  }
}
