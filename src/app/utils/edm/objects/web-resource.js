import EdmObject from '../object';
import EdmObjectType from '../object-type';

export default class WebResource extends EdmObject {
  constructor(options = {}) {
    super({
      edmObjectType: EdmObjectType.WebResource,
      namespace: 'edm',
      xmlDocument: options.xmlDocument,
      xmlElement: options.xmlElement,
    });
  }
}
