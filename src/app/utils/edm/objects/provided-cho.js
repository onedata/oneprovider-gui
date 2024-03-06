import EdmObject from '../object';
import EdmObjectType from '../object-type';

export default class ProvidedCHO extends EdmObject {
  constructor(options) {
    super({
      edmObjectType: EdmObjectType.ProvidedCHO,
      namespace: 'edm',
      // use one of:
      // - xmlDocument (when creating new element)
      // - xmlElement (when parsing from XML)
      xmlDocument: options.xmlDocument,
      xmlElement: options.xmlElement,
    });
  }
}
