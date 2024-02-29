import EdmObject from '../object';
import EdmObjectType from '../object-type';

export default EdmObject.extend({
  edmObjectType: EdmObjectType.WebResource,
  xmlNamespace: 'edm',
});
