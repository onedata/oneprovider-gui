import { set, setProperties } from '@ember/object';
import globals from 'onedata-gui-common/utils/globals';

const EdmXmlParser = class EdmXmlParser {
  /**
   * @param {string} xmlValue
   */
  constructor(xmlValue) {
    this.xmlValue = xmlValue;
    this.domParser = new DOMParser();
    /** @type {XMLDocument} */
    this.xmlDoc = this.domParser.parseFromString(this.xmlValue, 'text/xml');
    // FIXME: validacja, czy to jest rdf
    if (this.rootElement.nodeName !== 'rdf:RDF') {
      throw new Error('XML has no single <rdf:RDF> root node');
    }
  }
  get rootElement() {
    return this.xmlDoc.documentElement;
  }
  /**
   * @param {Utils.Edm.MetadataFactory} metadatafactory
   * @returns {Utils.Edm.Metadata}
   */
  createModel(medatadataFactory) {
    const metadata = medatadataFactory.createEmptyMetadata();
    const edmObjects = [];
    let hasMetadataExtraData = false;
    // FIXME: pierwszym obiektem xmlObjects może być tagName parsererror z komunikatem
    // wygląda na to, że to nie jest błąd krytyczny, ale należy go przechować w obiekcie metadata
    for (const xmlObject of this.rootElement.childNodes) {
      let hasEdmObjectExtraData = false;
      if (xmlObject.nodeName === 'parsererror') {
        // the first artificial tag that is added when parsing error occurs
        continue;
      }
      if (xmlObject.nodeType !== globals.window.Node.ELEMENT_NODE) {
        if (!this.isEmptyNode(xmlObject)) {
          hasMetadataExtraData = true;
        }
        continue;
      }
      // FIXME: tolerancja błędów z testami
      const [, edmObjectType] = xmlObject.nodeName.split(':');
      if (!edmObjectType) {
        // this is not supported tag, because all supported tags are namespaced
        if (!this.isEmptyNode(xmlObject)) {
          hasMetadataExtraData = true;
        }
        continue;
      }

      const properties = [];
      for (const xmlPropertyNode of xmlObject.childNodes) {
        const [namespace, propertyName] = xmlPropertyNode.nodeName.split(':');
        if (!propertyName) {
          // this is not supported tag, because all supported tags are namespaced
          if (!this.isEmptyNode(xmlPropertyNode)) {
            hasEdmObjectExtraData = true;
          }
          continue;
        }
        // FIXME: test i sprawdzanie nieznanych property z namespacem
        const edmProperty = medatadataFactory.createProperty(namespace, propertyName, {
          value: xmlPropertyNode.textContent,
          about: xmlPropertyNode.getAttribute('rdf:about'),
          lang: xmlPropertyNode.getAttribute('xml:lang'),
          resource: xmlPropertyNode.getAttribute('rdf:resource'),
        });
        const extraAttr = Array.from(xmlPropertyNode.attributes).find(attr =>
          !edmProperty.shownAttrs.includes(attr.name.split(':')[1] || attr.name)
        );
        if (extraAttr) {
          set(edmProperty, 'hasExtraData', true);
        }
        properties.push(edmProperty);
      }
      const edmObject = medatadataFactory.createObject(edmObjectType, {
        about: xmlObject.getAttribute('rdf:about'),
        properties,
        hasExtraData: hasEdmObjectExtraData,
      });
      edmObjects.push(edmObject);
    }
    setProperties(metadata, {
      edmObjects,
      hasExtraData: hasMetadataExtraData,
    });
    return metadata;
  }

  /**
   * @param {Node} node
   * @returns {boolean}
   */
  isEmptyNode(node) {
    return node.nodeType === globals.window.Node.TEXT_NODE && !node.nodeValue?.trim();
  }
};

export default EdmXmlParser;
