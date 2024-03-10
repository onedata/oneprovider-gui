import EdmObject from '../object';
import EdmObjectType from '../object-type';

export default class Aggregation extends EdmObject {
  constructor(options = {}) {
    super({
      edmObjectType: EdmObjectType.Aggregation,
      namespace: 'ore',
      xmlDocument: options.xmlDocument,
      xmlElement: options.xmlElement,
    });
  }
}
