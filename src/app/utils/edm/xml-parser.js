import { set, setProperties } from '@ember/object';

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
    if (this.rootNode.tagName !== 'rdf:RDF') {
      throw new Error('XML has no single <rdf:RDF> root node');
    }
  }
  get rootNode() {
    return this.xmlDoc.documentElement;
  }
  /** @returns {Array<Element>} */
  getObjects() {
    return Array.from(this.rootNode.children);
  }
  /**
   * @param {Element} object
   * @returns {Array<Element>}
   */
  getObjectProperties(object) {
    return object.children;
  }
  /**
   * @param {Utils.Edm.MetadataFactory} metadatafactory
   * @returns {Utils.Edm.Metadata}
   */
  createModel(medatadataFactory) {
    const xmlObjects = this.getObjects();
    const metadata = medatadataFactory.createEmptyMetadata();
    const edmObjects = [];
    let hasMetadataExtraData = false;
    // FIXME: pierwszym obiektem xmlObjects może być tagName parsererror z komunikatem
    // wygląda na to, że to nie jest błąd krytyczny, ale należy go przechować w obiekcie metadata
    for (const xmlObject of xmlObjects) {
      let hasEdmObjectExtraData = false;
      if (xmlObject.tagName === 'parsererror') {
        // the first artificial tag that is added when parsing error occurs
        continue;
      }
      // FIXME: tolerancja błędów z testami
      const [, edmObjectType] = xmlObject.tagName.split(':');
      if (!edmObjectType) {
        // this is not supported tag, because all supported tags are namespaced
        hasMetadataExtraData = true;
        continue;
      }

      const properties = [];
      for (const xmlPropertyElement of xmlObject.children) {
        const [namespace, propertyName] = xmlPropertyElement.tagName.split(':');
        if (!propertyName) {
          // this is not supported tag, because all supported tags are namespaced
          hasEdmObjectExtraData = true;
          continue;
        }
        // FIXME: test i sprawdzanie nieznanych property z namespacem
        const edmProperty = medatadataFactory.createProperty(namespace, propertyName, {
          value: xmlPropertyElement.textContent,
          about: xmlPropertyElement.getAttribute('rdf:about'),
          lang: xmlPropertyElement.getAttribute('xml:lang'),
          resource: xmlPropertyElement.getAttribute('rdf:resource'),
        });
        const extraAttr = Array.from(xmlPropertyElement.attributes).find(attr =>
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
};

export default EdmXmlParser;
