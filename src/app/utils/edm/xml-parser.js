import EdmMetadataFactory from './metadata-factory';

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
    return this.xmlDoc.children[0];
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
    // FIXME: pierwszym obiektem xmlObjects może być tagName parsererror z komunikatem
    // wygląda na to, że to nie jest błąd krytyczny, ale należy go przechować w obiekcie metadata
    for (const xmlObject of xmlObjects) {
      if (xmlObject.tagName === 'parsererror') {
        continue;
      }
      // FIXME: tolerancja błędów z testami
      const [, edmObjectType] = xmlObject.tagName.split(':');
      const properties = Array.from(xmlObject.children).map(xmlPropertyElement => {
        const [namespace, propertyName] = xmlPropertyElement.tagName.split(':');
        return medatadataFactory.createProperty(namespace, propertyName, {
          value: xmlPropertyElement.textContent,
          about: xmlPropertyElement.getAttribute('rdf:about'),
          lang: xmlPropertyElement.getAttribute('xml:lang'),
          resource: xmlPropertyElement.getAttribute('rdf:resource'),
        });
      });
      const edmObject = medatadataFactory.createObject(edmObjectType, {
        about: xmlObject.getAttribute('rdf:about'),
        properties,
      });
      metadata.edmObjects.push(edmObject);
    }
    return metadata;
  }
};

export default EdmXmlParser;
