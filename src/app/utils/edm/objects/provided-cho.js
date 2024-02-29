import EdmObject, { EdmObjectType } from '../object';

export default EdmObject.extend({
  edmObjectType: EdmObjectType.ProvidedCho,
  xmlNamespace: 'edm',

  /**
   * @override
   */
  xmlTagName: 'edm:ProvidedCHO',
});
