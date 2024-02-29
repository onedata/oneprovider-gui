import EdmObject, { EdmObjectType } from '../object';

export default EdmObject.extend({
  edmObjectType: EdmObjectType.WebResource,
  xmlNamespace: 'edm',
});
